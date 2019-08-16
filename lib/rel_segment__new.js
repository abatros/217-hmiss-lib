const {_assert} = require('./openacs-drive-api.js')

/*
  a rel_segment is a party.
  create a party (object_type, email, url, context_id)
  with object.title = segment_name
  then create a rel_segment (segment_name, group_id, rel_type)

  NOTE: (group, rel_type) UNIQUE.
  => each organization must have a group.

*/

module.exports = async (o) =>{
  const {
    //segment_id,
    object_type,
    creation_date = new Date(),
    creation_user,
    creation_ip = 'localhost',
    email,
    url,
    segment_name,
    group_id,
    rel_type,
    context_id
  } = o;

  _assert(segment_name, o, 'Missing segment-name')
  _assert(group_id, o, 'Missing group-id')
  _assert(rel_type, o, 'Missing rel-type')
  // tapp-member-rel, tapp-admin-rel

  return db.query(`
    select rel_segment__new(
      $(segment_id),
      $(object_type),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(email),
      $(url),
      $(segment_name),
      $(group_id),
      $(rel_type),
      $(context_id)) as segment_id;
  `, {
    segment_id: null,
    object_type,
    creation_date,
    creation_user,
    creation_ip,
    email,
    url,
    segment_name,
    group_id,
    rel_type,
    context_id
  }, {single:true})
}
