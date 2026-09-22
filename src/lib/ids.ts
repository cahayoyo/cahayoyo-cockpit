import { z } from 'zod';

// Fixed id seeded by migration 0001: the Inbox project always exists.
export const INBOX_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

// Database ids are checked format-only (`z.guid()`, not `z.uuid()`): Zod 4's
// `z.uuid()` enforces RFC 9562 version/variant bits, which seeded ids like the
// Inbox project above (version 0) fail even though PostgreSQL accepts them.
export const dbIdSchema = z.guid();
