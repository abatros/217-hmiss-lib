const {_assert} = require('./openacs-drive-api.js')

module.exports = async (o) =>{
  const {
    object_type = 'hmis-org',
    creation_date = new Date(),
    creation_user = null,
    creation_ip = 'localhost',
    email,
    url,
    group_name,
    join_policy ='open',
    context_id,
    verbose, if_exists_get
  } = o;

  _assert(group_name, o, 'Missing group_name');
  _assert(context_id, o, 'Missing context_id');

  let group_id = await db.query(`
    select group_id
    from groups
    join acs_objects on (object_id = group_id)
    where (context_id = $(context_id))
    and (group_name = $(group_name));
    `,{
      group_name,
      context_id
    }, {single:true})
  .then(retv =>{
    return retv && retv.group_id;
  })
  .catch(err =>{
    throw err
  });

  if (group_id) {
    return group_id
  }

  group_id = await db.query(`
    select acs_group__new(
      $(group_id),
      $(object_type),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(email),
      $(url),
      $(group_name),
      $(join_policy),
      $(context_id)) as group_id;
      `, {
        group_id:null,
        object_type,
        creation_date,
        creation_user,
        creation_ip,
        email,
        url,
        group_name,
        join_policy,
        context_id
      },{single:true})
  .then(retv =>{
    console.log(`group => retv:`,retv)
    return retv.group_id;
  })
  .catch(err =>{
    if ((err.code == 23505)&&(if_exists_get)) {
      return null;
    }
    throw err
  });

  return group_id;
}
