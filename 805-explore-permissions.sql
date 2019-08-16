select
  p.object_id, grantee_id, privilege,
  o.object_type as target_type, o.title as target_title,
  g.object_type as grantee_type, g.title as grantee_title
from acs_permissions p
join acs_objects o on (o.object_id = p.object_id)
join acs_objects g on (g.object_id = p.grantee_id)
order by target_type
;


select acs_rels.*, o1.object_type, o1.title, rel_type, o2.object_type, o2.title
from acs_rels
join acs_objects o1 on (o1.object_id = object_id_one)
join acs_objects o2 on (o2.object_id = object_id_two)
;
