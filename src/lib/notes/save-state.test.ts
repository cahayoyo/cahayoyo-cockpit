import { describe, expect, test } from 'bun:test';
import {
	initialSaveState,
	reduceSaveState,
	type NoteSaveEvent,
	type NoteSaveState
} from './save-state';

const SAVED_AT = new Date('2026-09-15T09:41:00Z');
const LATER = new Date('2026-09-15T10:02:00Z');

function run(
	events: NoteSaveEvent[],
	from: NoteSaveState = initialSaveState(SAVED_AT)
): NoteSaveState {
	return events.reduce(reduceSaveState, from);
}

describe('note save state', () => {
	test("starts clean with the note's server timestamp", () => {
		expect(initialSaveState(SAVED_AT)).toEqual({
			status: 'clean',
			savedAt: SAVED_AT,
			editedWhileSaving: false
		});
	});

	test('an edit marks the note dirty from clean, saved, and failed', () => {
		for (const from of [
			initialSaveState(SAVED_AT),
			run([{ type: 'edit' }, { type: 'save-start' }, { type: 'save-success', savedAt: LATER }]),
			run([{ type: 'edit' }, { type: 'save-start' }, { type: 'save-failure' }])
		]) {
			expect(run([{ type: 'edit' }], from).status).toBe('dirty');
		}
	});

	test('a save only starts from dirty or failed; clean and saved ignore it', () => {
		expect(run([{ type: 'save-start' }]).status).toBe('clean');
		expect(
			run([{ type: 'save-start' }], {
				status: 'saved',
				savedAt: SAVED_AT,
				editedWhileSaving: false
			}).status
		).toBe('saved');
		expect(run([{ type: 'edit' }, { type: 'save-start' }]).status).toBe('saving');
		expect(
			run([{ type: 'save-start' }], {
				status: 'failed',
				savedAt: SAVED_AT,
				editedWhileSaving: false
			}).status
		).toBe('saving');
	});

	test('success records the server timestamp and reaches saved', () => {
		const state = run([
			{ type: 'edit' },
			{ type: 'save-start' },
			{ type: 'save-success', savedAt: LATER }
		]);
		expect(state).toEqual({ status: 'saved', savedAt: LATER, editedWhileSaving: false });
	});

	test('edits during an in-flight save stay pending after it succeeds', () => {
		const state = run([
			{ type: 'edit' },
			{ type: 'save-start' },
			{ type: 'edit' },
			{ type: 'save-success', savedAt: LATER }
		]);
		expect(state).toEqual({ status: 'dirty', savedAt: LATER, editedWhileSaving: false });
	});

	test('a failure keeps the last saved timestamp and can be flushed again', () => {
		const failed = run([{ type: 'edit' }, { type: 'save-start' }, { type: 'save-failure' }]);
		expect(failed).toEqual({ status: 'failed', savedAt: SAVED_AT, editedWhileSaving: false });

		const flushed = run([{ type: 'save-start' }, { type: 'save-success', savedAt: LATER }], failed);
		expect(flushed.status).toBe('saved');
		expect(flushed.savedAt).toBe(LATER);
	});
});
