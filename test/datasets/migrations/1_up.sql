CREATE TABLE "Test" (
  "id" SERIAL PRIMARY KEY,
  "label" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "Test" ("label") VALUES (10);