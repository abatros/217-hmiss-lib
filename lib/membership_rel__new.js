const {_assert} = require('./openacs-drive-api.js')

/*
CREATE OR REPLACE FUNCTION public.membership_rel__new(
    new__rel_id integer,
    rel_type character varying,
    object_id_one integer,
    object_id_two integer,
    new__member_state character varying,
    creation_user integer,
    creation_ip character varying)
  RETURNS integer AS
*/

module.exports = membership_rel__new;


function membership_rel__new(o) {
  const {
    // rel_id, ignored
    rel_type = 'membership_rel',
    object_id_one,
    object_id_two,
    member_state ='approved',
    creation_user,
    creation_ip ='0.0.0.0'
  } = o;

  _assert(object_id_one, o, "fatal@29 Missing object_id_one")
  _assert(object_id_two, o, "fatal@30 Missing object_id_two")
  _assert(Number.isInteger(object_id_one), o, "fatal@31 Invalid object_id_one")
  _assert(Number.isInteger(object_id_two), o, "fatal@32 Invalid object_id_two")

  return db.query(`
    select membership_rel__new(
      $(rel_id)::integer,
      $(rel_type),
      $(object_id_one), $(object_id_two),
      $(member_state),
      $(creation_user),
      $(creation_ip)
    ) as rel_id;
  `,{
    rel_id:null,
    rel_type,
    object_id_one,
    object_id_two,
    member_state,
    creation_user,
    creation_ip
  },{single:true})
  .then(({rel_id}) => {return rel_id})
}
