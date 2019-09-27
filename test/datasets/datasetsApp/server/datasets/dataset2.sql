CREATE TABLE IF NOT EXISTS "MyTable2" (
  "id" SERIAL PRIMARY KEY,
  "name2" VARCHAR(255)
);

INSERT INTO "MyTable2" ("id", "name2") VALUES (1, 'name4'), (2, 'name5'), (3, 'name6'), (4, 'name7');

CREATE TABLE IF NOT EXISTS "MyTable3" (
  "id" SERIAL PRIMARY KEY,
  "name3" VARCHAR(255),
  "ref" INTEGER REFERENCES "MyTable2"("id")
);

INSERT INTO "MyTable3" ("name3", "ref") VALUES ('name7', 1), ('name8', 2);
