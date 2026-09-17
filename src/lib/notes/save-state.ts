export const NOTE_SAVE_STATUSES = ['clean', 'dirty', 'saving', 'saved', 'failed'] as const;

export type NoteSaveStatus = (typeof NOTE_SAVE_STATUSES)[number];

export type NoteSaveState = {
	status: NoteSaveStatus;
	/** Server `updated_at` of the last successful save. */
	savedAt: Date | null;
	/** Edits arrived while a save was in flight, so its success is not a clean state. */
	editedWhileSaving: boolean;
};

export type NoteSaveEvent =
	| { type: 'edit' }
	| { type: 'save-start' }
	| { type: 'save-success'; savedAt: Date }
	| { type: 'save-failure' };

export function initialSaveState(savedAt: Date | null = null): NoteSaveState {
	return { status: 'clean', savedAt, editedWhileSaving: false };
}

// Save model: debounced autosave plus an explicit Save button and flush on
// navigation (`save-start`); a failed save keeps the dirty content and retries
// on the next edit, Save click, or flush. Edits during an in-flight save leave
// the note dirty again once that save resolves.
export function reduceSaveState(state: NoteSaveState, event: NoteSaveEvent): NoteSaveState {
	switch (event.type) {
		case 'edit':
			return state.status === 'saving'
				? { ...state, editedWhileSaving: true }
				: { ...state, status: 'dirty', editedWhileSaving: false };
		case 'save-start':
			return state.status === 'dirty' || state.status === 'failed'
				? { ...state, status: 'saving', editedWhileSaving: false }
				: state;
		case 'save-success':
			return {
				status: state.editedWhileSaving ? 'dirty' : 'saved',
				savedAt: event.savedAt,
				editedWhileSaving: false
			};
		case 'save-failure':
			return { ...state, status: 'failed', editedWhileSaving: false };
	}
}
