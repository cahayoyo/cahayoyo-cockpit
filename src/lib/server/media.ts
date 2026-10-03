import { S3Client } from 'bun';
import { and, eq } from 'drizzle-orm';
import { mediaUploadSchema } from '$lib/media/schemas';
import { mediaObjectKey, type UploadMimeType } from '$lib/media/upload';
import { db } from './db';
import { bookmark, media } from './db/schema';
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

export type SaveMediaResult = { ok: true; media: MediaRow } | { ok: false; error: string };

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

/**
 * First step of an account's media purge (hard delete): clear the bookmark
 * references and return the account's R2 storage paths. `bookmark.image_id` is
 * `ON DELETE RESTRICT`, so the account-delete cascade needs those refs gone
 * first; the media rows themselves stay until that cascade removes them (so a
 * failed account delete leaves the media intact, not half-deleted). Call
 * `deleteMediaObjects` with the returned paths afterwards. Note bodies keep no
 * FK to media, so nothing else blocks. The bookmark pre-clear is temporary: it
 * goes away once the bookmark table is dropped.
 *
 * Trade-off: if the caller's `removeUser` then fails, the account survives but
 * its bookmarks have lost their image references. That is the least-destructive
 * partial state available — deleting the rows first would lose the media, and
 * the RESTRICT FK forbids keeping the references through the cascade.
 */
export async function collectOwnerMediaPaths(ownerId: string): Promise<string[]> {
	await db.update(bookmark).set({ imageId: null }).where(eq(bookmark.ownerId, ownerId));

	const rows = await db
		.select({ storagePath: media.storagePath })
		.from(media)
		.where(eq(media.ownerId, ownerId));

	return rows.map((row) => row.storagePath);
}

/**
 * Second step of an account's media purge: delete the R2 objects by path.
 * Best-effort: the account row is already gone when this runs, so a failed
 * object is logged and skipped rather than failing the request — a leftover
 * blob is the acceptable outcome, a 500 for a completed delete is not.
 */
export async function deleteMediaObjects(paths: string[]): Promise<void> {
	for (const path of paths) {
		try {
			await s3.file(path).delete();
		} catch (error) {
			console.error('Media object delete failed during account purge:', path, error);
		}
	}
}

export async function getMediaFile(
	ownerId: string,
	id: string
): Promise<{ body: ReadableStream<Uint8Array>; mimeType: string } | null> {
	const [row] = await db
		.select()
		.from(media)
		.where(and(eq(media.id, id), eq(media.ownerId, ownerId)));

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
