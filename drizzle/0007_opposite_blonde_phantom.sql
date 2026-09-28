-- Folder trees and tag namespaces become per module. Rows predate the split, so
-- backfill before the NOT NULL constraints land: derive each folder's scope from
-- its subtree, clone ancestors that both modules need, derive each tag's scope
-- from its links, and drop tags that nothing links to.
CREATE TYPE "public"."folder_kind" AS ENUM('bookmark', 'note');--> statement-breakpoint
CREATE TYPE "public"."tag_kind" AS ENUM('bookmark', 'note', 'task', 'vault');--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "kind" "folder_kind";--> statement-breakpoint
ALTER TABLE "tag" ADD COLUMN "kind" "tag_kind";--> statement-breakpoint
DO $$
DECLARE
  rec record;
  new_id uuid;
BEGIN
  -- For every folder, whether its subtree contains bookmarks and/or notes.
  CREATE TEMP TABLE folder_usage ON COMMIT DROP AS
  WITH RECURSIVE subtree(root, node) AS (
    SELECT id, id FROM "folder"
    UNION ALL
    SELECT s.root, f.id FROM subtree s JOIN "folder" f ON f.parent_id = s.node
  )
  SELECT root AS id,
    bool_or(EXISTS (SELECT 1 FROM bookmark b WHERE b.folder_id = node)) AS has_bookmark,
    bool_or(EXISTS (SELECT 1 FROM note n WHERE n.folder_id = node)) AS has_note
  FROM subtree
  GROUP BY root;

  -- A folder is bookmark-only, note-only, or shared (both).
  UPDATE "folder" f SET kind =
    CASE
      WHEN u.has_bookmark THEN 'bookmark'::folder_kind
      WHEN u.has_note THEN 'note'::folder_kind
    END
  FROM folder_usage u
  WHERE u.id = f.id;

  -- Empty folders inherit the nearest scoped ancestor; unscoped roots default to bookmark.
  LOOP
    UPDATE "folder" f SET kind = p.kind
    FROM "folder" p
    WHERE f.kind IS NULL AND f.parent_id = p.id AND p.kind IS NOT NULL;
    EXIT WHEN NOT FOUND;
  END LOOP;
  UPDATE "folder" SET kind = 'bookmark' WHERE kind IS NULL;

  -- Shared folders stay in the bookmark tree; clone them into the note tree.
  CREATE TEMP TABLE folder_clone (orig uuid PRIMARY KEY, clone uuid NOT NULL) ON COMMIT DROP;
  FOR rec IN
    SELECT f.id, f.owner_id, f.name
    FROM "folder" f JOIN folder_usage u ON u.id = f.id
    WHERE u.has_bookmark AND u.has_note
  LOOP
    INSERT INTO "folder" (owner_id, name, parent_id, kind)
    VALUES (rec.owner_id, rec.name, NULL, 'note')
    RETURNING id INTO new_id;
    INSERT INTO folder_clone VALUES (rec.id, new_id);
  END LOOP;

  -- Nest each clone under its original's note-scope parent (another clone or a
  -- note-only folder), never under a bookmark folder.
  UPDATE "folder" c SET parent_id = np.note_parent
  FROM folder_clone fc
  JOIN "folder" o ON o.id = fc.orig
  LEFT JOIN LATERAL (
    SELECT COALESCE(pc.clone, p.id) AS note_parent
    FROM "folder" p
    LEFT JOIN folder_clone pc ON pc.orig = p.id
    WHERE p.id = o.parent_id AND (pc.clone IS NOT NULL OR p.kind = 'note')
  ) np ON true
  WHERE c.id = fc.clone;

  -- Move notes and note child folders that sat directly in a shared folder.
  UPDATE note n SET folder_id = fc.clone FROM folder_clone fc WHERE n.folder_id = fc.orig;
  UPDATE "folder" f SET parent_id = fc.clone
  FROM folder_clone fc
  WHERE f.parent_id = fc.orig AND f.kind = 'note' AND f.id <> fc.clone;
END $$;--> statement-breakpoint
DO $$
DECLARE
  rec record;
  new_id uuid;
BEGIN
  -- Every (tag, module) usage, so a tag shared by two modules is split too.
  CREATE TEMP TABLE tag_usage (tag_id uuid, kind tag_kind) ON COMMIT DROP;
  INSERT INTO tag_usage
    SELECT DISTINCT tag_id, 'bookmark'::tag_kind FROM bookmark_tag
    UNION SELECT DISTINCT tag_id, 'note'::tag_kind FROM note_tag
    UNION SELECT DISTINCT tag_id, 'task'::tag_kind FROM task_tag
    UNION SELECT DISTINCT tag_id, 'vault'::tag_kind FROM vault_entry_tag;

  -- The original row takes its first (lowest-precedence) usage kind.
  UPDATE "tag" t SET kind = u.kind
  FROM (
    SELECT DISTINCT ON (tag_id) tag_id, kind
    FROM tag_usage
    ORDER BY tag_id,
      CASE kind WHEN 'bookmark' THEN 1 WHEN 'note' THEN 2 WHEN 'task' THEN 3 ELSE 4 END
  ) u
  WHERE u.tag_id = t.id;

  -- Clone the tag for each further module that used it.
  CREATE TEMP TABLE tag_clone (tag_id uuid, kind tag_kind, clone uuid) ON COMMIT DROP;
  FOR rec IN
    SELECT tu.tag_id, tu.kind
    FROM tag_usage tu JOIN "tag" t ON t.id = tu.tag_id
    WHERE tu.kind <> t.kind
  LOOP
    INSERT INTO "tag" (owner_id, name, kind)
    SELECT owner_id, name, rec.kind FROM "tag" WHERE id = rec.tag_id
    RETURNING id INTO new_id;
    INSERT INTO tag_clone VALUES (rec.tag_id, rec.kind, new_id);
  END LOOP;

  -- Point each module's link rows at the row for that module's kind.
  UPDATE bookmark_tag l SET tag_id = tc.clone FROM tag_clone tc WHERE l.tag_id = tc.tag_id AND tc.kind = 'bookmark';
  UPDATE note_tag l SET tag_id = tc.clone FROM tag_clone tc WHERE l.tag_id = tc.tag_id AND tc.kind = 'note';
  UPDATE task_tag l SET tag_id = tc.clone FROM tag_clone tc WHERE l.tag_id = tc.tag_id AND tc.kind = 'task';
  UPDATE vault_entry_tag l SET tag_id = tc.clone FROM tag_clone tc WHERE l.tag_id = tc.tag_id AND tc.kind = 'vault';

  -- Tags nothing links to have no scope.
  DELETE FROM "tag" WHERE kind IS NULL;
END $$;--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
DROP INDEX "folder_owner_id_idx";--> statement-breakpoint
DROP INDEX "tag_owner_id_idx";--> statement-breakpoint
CREATE INDEX "folder_owner_kind_idx" ON "folder" USING btree ("owner_id","kind");--> statement-breakpoint
CREATE INDEX "tag_owner_kind_idx" ON "tag" USING btree ("owner_id","kind");--> statement-breakpoint
ALTER TABLE "tag" DROP CONSTRAINT "tag_owner_name_unique";--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_owner_kind_name_unique" UNIQUE("owner_id","kind","name");
