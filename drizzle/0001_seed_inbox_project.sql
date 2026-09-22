-- The default Inbox project must exist after a fresh migration (PRD §5.5).
INSERT INTO "project" ("id", "name")
VALUES ('00000000-0000-0000-0000-000000000001', 'Inbox')
ON CONFLICT ("id") DO NOTHING;
