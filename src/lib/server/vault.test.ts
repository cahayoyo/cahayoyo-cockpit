import { describe, expect, test } from 'bun:test';
import { VAULT_TYPES } from '$lib/vault/types';
import { vaultEntryType } from './db/schema';

// The client-safe type list cannot be derived from the DB enum (server-only
// module), so this guard fails if a migration changes the enum without the
// client-side list.
describe('vault type list', () => {
	test('mirrors the vault_entry_type enum', () => {
		expect([...VAULT_TYPES]).toEqual([...vaultEntryType.enumValues]);
	});
});
