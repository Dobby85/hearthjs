SELECT
  {{ data.body.firstname}}::text as "firstname",
  {{ data.body.lastname}}::text as "lastname",
  {{ data.body.mail}}::text as "mail",
  {{ data.body.age}}::int4 as "age"
