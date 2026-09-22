import { describe, expect, test } from 'bun:test';
import {
	ancestorIds,
	buildFolderTree,
	folderIdsWithDescendants,
	folderLabel,
	folderPath,
	type FolderRow
} from './tree';

const folders: FolderRow[] = [
	{ id: 'a', name: 'qa', parentId: null },
	{ id: 'b', name: 'automation', parentId: 'a' },
	{ id: 'c', name: 'manual', parentId: 'a' },
	{ id: 'd', name: 'e2e', parentId: 'b' },
	{ id: 'e', name: 'docs', parentId: null }
];

describe('buildFolderTree', () => {
	test('nests children under their parents and keeps top-level folders as roots', () => {
		const tree = buildFolderTree(folders);

		expect(tree.map((node) => node.id)).toEqual(['a', 'e']);
		expect(tree[0].children.map((node) => node.id)).toEqual(['b', 'c']);
		expect(tree[0].children[0].children.map((node) => node.id)).toEqual(['d']);
	});

	test('returns an empty forest for empty input', () => {
		expect(buildFolderTree([])).toEqual([]);
	});
});

describe('folderPath', () => {
	test('returns the path from the top-level folder down to the node', () => {
		expect(folderPath(folders, 'd').map((folder) => folder.id)).toEqual(['a', 'b', 'd']);
	});

	test('returns an empty path for an unknown folder', () => {
		expect(folderPath(folders, 'missing')).toEqual([]);
	});
});

describe('folderLabel', () => {
	test('joins the path names with slashes', () => {
		expect(folderLabel(folders, 'd')).toBe('qa / automation / e2e');
	});

	test('is empty for an unknown folder', () => {
		expect(folderLabel(folders, 'missing')).toBe('');
	});
});

describe('folderIdsWithDescendants', () => {
	test('includes the folder itself and every descendant', () => {
		expect([...folderIdsWithDescendants(folders, 'a')].sort()).toEqual(['a', 'b', 'c', 'd']);
	});

	test('scopes to the subtree, never siblings or unrelated branches', () => {
		expect([...folderIdsWithDescendants(folders, 'b')].sort()).toEqual(['b', 'd']);
		expect([...folderIdsWithDescendants(folders, 'e')]).toEqual(['e']);
	});
});

describe('ancestorIds', () => {
	test('returns every ancestor from the parent up to the top level', () => {
		expect([...ancestorIds(folders, 'd')].sort()).toEqual(['a', 'b']);
	});

	test('is empty for top-level and unknown folders', () => {
		expect(ancestorIds(folders, 'a').size).toBe(0);
		expect(ancestorIds(folders, 'missing').size).toBe(0);
	});
});
