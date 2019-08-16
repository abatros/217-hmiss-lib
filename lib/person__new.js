const {_assert} = require('./openacs-drive-api.js')

module.exports = async (p, o) =>{

  const {
    person_id: _person_id,
    object_type,
    creation_date = new Date(),
    creation_user,
    creation_ip = '127.0.0.1',
    email,
    url,
    first_names,
    last_name,
    context_id
  } = p;


  _assert(first_names, p, 'Missing first_names')
  _assert(last_name, p, 'Missing last_name')
  _assert(email, p, 'Missing email'); // unique => could be ssn@localhost

  const p2 = {
      person_id:null,
      object_type,
      creation_date,
      creation_user,
      creation_ip,
      email,
      url,
      first_names,
      last_name,
      context_id
  };

  return await db.query(`
    select person__new(
      $(person_id),
      $(object_type),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(email),
      $(url),
      $(first_names),
      $(last_name),
      $(context_id)) as person_id;
  `, p2 , {single:true})
  .then(retv =>{
    return retv.person_id;
  });
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
