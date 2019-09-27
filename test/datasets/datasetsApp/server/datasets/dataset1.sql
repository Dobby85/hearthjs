CREATE TABLE IF NOT EXISTS "MyTable" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255)
);

INSERT INTO "MyTable" ("name") VALUES ('name1'), ('name2'), ('name3');