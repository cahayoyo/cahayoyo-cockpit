// Account list shape shared by the server query layer and the users page UI
// (#89). Client-safe: no server imports, so components and the load can use the
// same type instead of redeclaring it.
export type AccountListItem = {
	id: string;
	email: string;
	name: string;
	role: string;
	banned: boolean;
	createdAt: Date;
};
