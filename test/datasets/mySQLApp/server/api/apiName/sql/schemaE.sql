SELECT
  {{ data.firstname}}::text as "firstname",
  {{ data.lastname}}::text as "lastname",
  {{ data.mail}}::text as "mail",
  {{ data.age}}::int4 as "age"