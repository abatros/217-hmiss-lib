const {_assert} = require('./openacs-drive-api.js')

module.exports = async (o) =>{
  const {
    // rel_id,
    rel_type,
    object_id_one,
    object_id_two,
    context_id,
    creation_user,
    creation_ip = '127.0.0.1',
    // extension
    package_id
  } = o;

  return db.query(`
    select acs_rel__new(
      $(_rel_id),
      $(rel_type),
      $(object_id_one),
      $(object_id_two),
      $(context_id),
      $(creation_user),
      $(creation_ip)
    ) as rel_id;
  `,{
    _rel_id: null,
    rel_type,
    object_id_one,
    object_id_two,
    context_id,
    creation_user,
    creation_ip
  }, {single:true})
  .then(async ({rel_id}) =>{
    _assert(Number.isInteger(rel_id), rel_id, 'missing rel_id@36')
    if (package_id) {
      await db.query(
        `update acs_objects
        set package_id = $(package_id)
        where (object_id = $(rel_id))
        `, {package_id, rel_id}, {single:true}
      );
    }
    return rel_id;
  })
  .catch(err =>{
    if (err.code != 23505) throw err;
    console.log(`arc_rel already exists =>`,err.detail)
  })

}


/*
CREATE OR REPLACE FUNCTION public.acs_rel__new(
    new__rel_id integer,
    new__rel_type character varying,
    new__object_id_one integer,
    new__object_id_two integer,
    context_id integer,
    creation_user integer,
    creation_ip character varying)
  RETURNS integer AS
*/
