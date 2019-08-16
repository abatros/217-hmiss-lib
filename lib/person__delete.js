const {_assert} = require('./openacs-drive-api.js')

module.exports = async (person_id) =>{

  _assert(person_id, null, 'Missing person_id')

  await db.query(`
    select person__delete($(person_id));
  `, {person_id} , {single:true});
} // export



/*
CREATE OR REPLACE FUNCTION public.person__new(
    new__person_id integer,
    new__object_type character varying,
    new__creation_date timestamp with time zone,
    new__creation_user integer,
    new__creation_ip character varying,
    new__email character varying,
    new__url character varying,
    new__first_names character varying,
    new__last_name character varying,
    new__context_id integer)
  RETURNS integer AS



$(person_id),
$(object_type),
$(creation_date),
$(creation_user),
$(creation_ip),
$(email),
$(url),
$(first_names),
$(last_name),
$(context_id),


*/
