SELECT
  {{ data.firstname}}::text as "firstname",
  {{ data.lastname}}::text as "lastname",
  {{ data.mail}}::text as "mail"
{# data.where #}
  WHERE 1 = {{ data.id }}
{{#}}