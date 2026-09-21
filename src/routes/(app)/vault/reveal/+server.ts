import { json } from '@sveltejs/kit';
import { dbIdSchema } from '$lib/ids';
import { revealEntry } from '$lib/server/vault';
import { isVaultUnlocked, issueVaultUnlock } from '$lib/server/vault-unlock';
import type { RequestHandler } from './$types.js';

// Reveal transport: POST-only JSON, never cached, so plaintext stays out of load
// data, the SSR payload, and any cache (grill decisions + architect default).
export const POST: RequestHandler = async ({ request, cookies }) => {
	const headers = { 'cache-control': 'no-store' };

	if (!isVaultUnlocked(cookies)) {
		return json(
			{ ok: false, reason: 'locked', message: 'Vault is locked.' },
			{ status: 401, headers }
		);
	}

	const formData = await request.formData();
	const parsedId = dbIdSchema.safeParse(formData.get('id'));
	if (!parsedId.success) {
		return json(
			{ ok: false, reason: 'invalid', message: 'Invalid entry.' },
			{ status: 400, headers }
		);
	}

	const revealed = await revealEntry(parsedId.data);
	if (!revealed.ok) {
		return json(
			{ ok: false, reason: revealed.reason, message: revealed.error },
			{ status: revealed.reason === 'missing' ? 404 : 400, headers }
		);
	}

	// A reveal is a vault action: it slides the 15-minute idle window.
	issueVaultUnlock(cookies);
	return json({ ok: true, secret: revealed.secret, notes: revealed.notes }, { headers });
};
