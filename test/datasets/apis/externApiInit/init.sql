CREATE TABLE "ExternTable" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) DEFAULT NULL
);

INSERT INTO "ExternTable" ("name") VALUES ('test');