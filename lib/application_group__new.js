/*
  a group consisting of users and parties of an application.
  They include a package_id field which allows them to be easily "scoped"
  to a specific "application"/subsite
  (see related procedures: http://openacs.org/api-doc/procs-file-view?path=packages/acs-subsite/tcl/application-group-procs.tcl&public_p=0)

  https://openacs.org/api-doc/proc-view?proc=application_group::new&source_p=1
*/

const {_assert} = require('./openacs-drive-api.js')

module.exports = async (o)=>{

  const {group_type, package_id, context_id,
    email, url,
    join_policy, // not used.
    verbose
  } = o;
  const {object_type =group_type} = o;

  let {group_id, creation_user, creation_ip, group_name} = o;
  // if connection, get usedId, and ip

  _assert(!group_id, o, 'Missing group_type')
  _assert(object_type, o, 'Missing group_type')
  _assert(group_name, o, 'Missing group_name')
  _assert(package_id, o, 'Missing package_id')

  if (!group_name) {
    await db.query(`
      select substring(instance_name, 1, 90)
      from apm_packages
      where package_id = $(package_id) as _group_name;
    `, {package_id},{single:true})
    .then(retv =>{
      group_name = _group_name
    })
  }

  // 11 args.
  group_id = await db.query(`
    select application_group__new(
      $(group_id),
      $(object_type),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(email),
      $(url),
      $(group_name),
      $(package_id),
      $(join_policy),
      $(context_id)) as group_id;
    `,{
      group_id,
      object_type, // group_type
      creation_date: new Date(),
      creation_user,
      creation_ip,
      email,
      url,
      group_name,
      package_id,
      join_policy: null,
      context_id
    }, {single:true})
  .then(retv =>{
    verbose &&
    console.log(`application_group__new => retv:`,retv)
    return retv.group_id;
  })
  .catch(err =>{
    console.log(`error code:${err.code} => ${err.detail}`);
    if (!err.detail) console.log(err)
    throw 'FATAL'
  });

  return group_id;
}
