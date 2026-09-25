import { S3Client } from 'bun';
import { count, desc, eq } from 'drizzle-orm';
import { mediaUploadSchema } from '$lib/bookmarks/schemas';
import { mediaObjectKey, type UploadMimeType } from '$lib/bookmarks/upload';
import { extractMediaIds } from '$lib/notes/media-refs';
import { db } from './db';
import { bookmark, media, note } from './db/schema';
import { envSchema } from './env';

const env = envSchema.parse(process.env);

// Bun's native S3 client talks to the private R2 bucket (ADR-0004): no SDK
// dependency, no public bucket, no presigned URLs — uploads and reads go
// through the authenticated /media/[id] proxy.
const s3 = new S3Client({
	accessKeyId: env.R2_ACCESS_KEY_ID,
	secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	bucket: env.R2_BUCKET,
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
});

export type MediaRow = typeof media.$inferSelect;
export type MediaWithUsage = MediaRow & { usageCount: number };

export type SaveMediaResult = { ok: true; media: MediaRow } | { ok: false; error: string };
export type DeleteMediaResult =
	{ ok: true } | { ok: false; bookmarkCount: number; noteCount: number };

export async function saveMedia(ownerId: string, file: File): Promise<SaveMediaResult> {
	const parsed = mediaUploadSchema.safeParse(file);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid image.' };
	}

	const id = crypto.randomUUID();
	const storagePath = mediaObjectKey(id, file.type as UploadMimeType);
	const object = s3.file(storagePath);
	await object.write(file, { type: file.type });

	try {
		const [row] = await db
			.insert(media)
			.values({
				id,
				ownerId,
				originalName: file.name,
				mimeType: file.type,
				sizeBytes: file.size,
				storagePath
			})
			.returning();

		return { ok: true, media: row };
	} catch (error) {
		await object.delete();
		throw error;
	}
}

async function bookmarkUsageCount(id: string): Promise<number> {
	const [row] = await db
		.select({ usageCount: count() })
		.from(bookmark)
		.where(eq(bookmark.imageId, id));

	return row?.usageCount ?? 0;
}

// Notes have no FK to media: usage is computed by scanning every note body for
// the `/media/<id>` reference. Cost is bounded by the number of notes.
async function noteUsageCounts(): Promise<Map<string, number>> {
	const rows = await db.select({ body: note.body }).from(note);
	const counts = new Map<string, number>();

	for (const row of rows) {
		for (const id of extractMediaIds(row.body)) {
			counts.set(id, (counts.get(id) ?? 0) + 1);
		}
	}

	return counts;
}

export async function listMedia(): Promise<MediaWithUsage[]> {
	const [rows, noteCounts] = await Promise.all([
		db
			.select({
				id: media.id,
				ownerId: media.ownerId,
				originalName: media.originalName,
				mimeType: media.mimeType,
				sizeBytes: media.sizeBytes,
				storagePath: media.storagePath,
				createdAt: media.createdAt,
				usageCount: count(bookmark.id)
			})
			.from(media)
			.leftJoin(bookmark, eq(bookmark.imageId, media.id))
			.groupBy(media.id)
			.orderBy(desc(media.createdAt)),
		noteUsageCounts()
	]);

	return rows.map((row) => ({
		...row,
		usageCount: row.usageCount + (noteCounts.get(row.id) ?? 0)
	}));
}

export async function mediaUsageCount(id: string): Promise<number> {
	const [bookmarks, notes] = await Promise.all([bookmarkUsageCount(id), noteUsageCounts()]);
	return bookmarks + (notes.get(id) ?? 0);
}

export async function deleteMedia(id: string): Promise<DeleteMediaResult> {
	// The note half of this guard is a body scan, so the check and the delete
	// are not atomic (there is deliberately no FK between note and media): a note
	// saved in the gap could keep a dangling reference. Acceptable at the current
	// workspace scale; a DB-level constraint is the fix if that changes.
	const [bookmarkCount, noteCounts] = await Promise.all([
		bookmarkUsageCount(id),
		noteUsageCounts()
	]);
	const noteCount = noteCounts.get(id) ?? 0;
	if (bookmarkCount > 0 || noteCount > 0) {
		return { ok: false, bookmarkCount, noteCount };
	}

	const [row] = await db.delete(media).where(eq(media.id, id)).returning();
	if (row) {
		await s3.file(row.storagePath).delete();
	}

	return { ok: true };
}

export async function getMediaFile(
	id: string
): Promise<{ body: ReadableStream<Uint8Array>; mimeType: string } | null> {
	const [row] = await db.select().from(media).where(eq(media.id, id));
	if (!row) {
		return null;
	}

	const object = s3.file(row.storagePath);
	if (!(await object.exists())) {
		return null;
	}

	// S3File is a Blob, but Bun's Response rejects ResponseInit options when the
	// body is one; hand the proxy a plain stream so it can set its headers.
	return { body: object.stream(), mimeType: row.mimeType };
}
