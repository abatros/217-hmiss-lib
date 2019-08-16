const {openacs_api:api, tapp, _assert} = require('../lib');
const register_organization = require('./organization.js');

/*

      PURGE ALL FOLDERS WITHIN AN APP_INSTANCE.

*/

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');

  const groups = await db.query(`
    select *
    from groups
    join parties on (party_id = group_id)
    join acs_objects o on (object_id = group_id)
    where
      (o.object_type = 'hmis-org')
    -- (o.package_id = $(package_id))
    order by object_id;
  `, {package_id}, {single:false})


  console.log(`[purge-groups] found ${groups.length} groups`)
  for (const group of groups) {
    const {object_id, group_name, object_type} = group;
    console.log(`-- ${package_id}:${object_id}:${object_type} ${group_name}`)
    await api.group__delete(object_id)
    .then(()=>{
      console.log(`deleted Ok.`)
    })
    .catch(err =>{
      console.log(err.detail)
    })
  }
  console.log(`[purge-groups] found ${groups.length} groups`)

}
