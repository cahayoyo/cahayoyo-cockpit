import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
	boolean,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Better Auth core tables (better-auth 1.7.4).
// Columns are snake_case; the drizzle adapter receives this schema explicitly
// in src/lib/server/auth.ts, so no `fields` mappings are needed.
// PKs are `text` by design: Better Auth's Drizzle adapter expects text ids;
// values stay UUIDs via a custom `advanced.database.generateId` generator in
// auth.ts (the PKs carry no database default).
// App tables use native `uuid` PKs — both styles are intentional, not drift.
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_user_id_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('account_user_id_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

// ---------------------------------------------------------------------------
// Application tables (PRD §5).
// ---------------------------------------------------------------------------

export const taskStatus = pgEnum('task_status', [
	'backlog',
	'in_progress',
	'review',
	'waiting_for_acceptance',
	'waiting_for_deployment',
	'done'
]);

export const taskPriority = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

export const disposableEmailStatus = pgEnum('disposable_email_status', ['active', 'dead']);

export const vaultEntryType = pgEnum('vault_entry_type', ['login', 'api_key', 'note']);

export const media = pgTable('media', {
	id: uuid('id').primaryKey().defaultRandom(),
	originalName: text('original_name').notNull(),
	mimeType: text('mime_type').notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	storagePath: text('storage_path').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const folder = pgTable('folder', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	// Virtual-root tree: top-level folders have parent_id NULL; deleting a folder
	// cascades to its subtree while contained bookmarks are unfiled via SET NULL.
	parentId: uuid('parent_id').references((): AnyPgColumn => folder.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const bookmark = pgTable('bookmark', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	url: text('url').notNull(),
	description: text('description'),
	favorite: boolean('favorite').default(false).notNull(),
	imageId: uuid('image_id').references(() => media.id, { onDelete: 'restrict' }),
	folderId: uuid('folder_id').references(() => folder.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const note = pgTable('note', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	body: text('body').notNull().default(''),
	folderId: uuid('folder_id').references(() => folder.id, { onDelete: 'set null' }),
	pinned: boolean('pinned').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const project = pgTable('project', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const task = pgTable('task', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	description: text('description'),
	// ON DELETE no action: a project with tasks cannot be deleted (deliberate;
	// revisit when project CRUD lands).
	projectId: uuid('project_id')
		.notNull()
		.references(() => project.id),
	status: taskStatus('status').default('backlog').notNull(),
	priority: taskPriority('priority').default('medium').notNull(),
	dueDate: date('due_date'),
	// Depth (one level) and cycles are enforced in the app layer (PRD §5.5, Phase 7).
	parentId: uuid('parent_id').references((): AnyPgColumn => task.id, { onDelete: 'cascade' }),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const disposableEmail = pgTable('disposable_email', {
	id: uuid('id').primaryKey().defaultRandom(),
	address: text('address').notNull(),
	provider: text('provider'),
	purpose: text('purpose'),
	taskId: uuid('task_id').references(() => task.id, { onDelete: 'set null' }),
	status: disposableEmailStatus('status').default('active').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const vaultEntry = pgTable('vault_entry', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	type: vaultEntryType('type').notNull(),
	username: text('username'),
	secretValue: text('secret_value').notNull(),
	url: text('url'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const tag = pgTable('tag', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const bookmarkTag = pgTable(
	'bookmark_tag',
	{
		bookmarkId: uuid('bookmark_id')
			.notNull()
			.references(() => bookmark.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.bookmarkId, table.tagId] })]
);

export const noteTag = pgTable(
	'note_tag',
	{
		noteId: uuid('note_id')
			.notNull()
			.references(() => note.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.noteId, table.tagId] })]
);

export const taskTag = pgTable(
	'task_tag',
	{
		taskId: uuid('task_id')
			.notNull()
			.references(() => task.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.taskId, table.tagId] })]
);

export const vaultEntryTag = pgTable(
	'vault_entry_tag',
	{
		vaultEntryId: uuid('vault_entry_id')
			.notNull()
			.references(() => vaultEntry.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.vaultEntryId, table.tagId] })]
);
