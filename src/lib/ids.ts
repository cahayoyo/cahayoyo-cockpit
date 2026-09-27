import { z } from 'zod';

// Database ids are checked format-only (`z.guid()`, not `z.uuid()`): Zod 4's
// `z.uuid()` enforces RFC 9562 version/variant bits, which seeded ids (version 0,
// e.g. the Inbox project) fail even though PostgreSQL accepts them.
export const dbIdSchema = z.guid();
