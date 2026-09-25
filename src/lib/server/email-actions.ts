import { fail, type RequestEvent } from '@sveltejs/kit';
import { emailFormSchema, emailStatusSchema } from '$lib/emails/schemas';
import { dbIdSchema } from '$lib/ids';
import { createEmail, deleteEmail, setEmailStatus, updateEmail } from './emails';
import { optionalId, requiredId, text } from './form-data';
import { requireUserId } from './session';

// Emails form actions: one implementation for the emails page — the
// emailActions counterpart of taskActions/folderActions.
export const emailActions = {
	saveEmail: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = emailFormSchema.safeParse({
			address: text(formData, 'address'),
			provider: text(formData, 'provider'),
			purpose: text(formData, 'purpose'),
			taskId: optionalId(formData, 'taskId'),
			status: text(formData, 'status'),
			notes: text(formData, 'notes')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid address.' });
		}

		// No id: the dialog is creating; otherwise it edits that record.
		const id = text(formData, 'id');
		if (id === '') {
			const created = await createEmail(requireUserId(locals), parsed.data);
			if (!created.ok) {
				return fail(400, { message: created.error });
			}

			return { emailId: created.id };
		}

		const parsedId = dbIdSchema.safeParse(id);
		if (!parsedId.success) {
			return fail(400, { message: 'Invalid address.' });
		}

		const updated = await updateEmail(parsedId.data, parsed.data);
		if (!updated.ok) {
			return fail(400, { message: updated.error });
		}

		return { saved: true, emailId: parsedId.data };
	},

	setEmailStatus: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const id = requiredId(formData);
		const status = emailStatusSchema.safeParse(text(formData, 'status'));
		if (!id || !status.success) {
			return fail(400, { message: 'Invalid address.' });
		}

		if (!(await setEmailStatus(id, status.data))) {
			return fail(404, { message: 'This address no longer exists.' });
		}

		return { updated: true };
	},

	deleteEmail: async ({ request }: RequestEvent) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid address.' });
		}

		await deleteEmail(id);
		return { deleted: true };
	}
};
