const {openacs_api:api, tapp, _assert} = require('../lib');
const register_organization = require('./organization.js')

/*

      PURGE ALL ORGANIZATIONS WITHIN AN APP_INSTANCE

*/

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder, organizations} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');
  _assert(organizations, o, 'Missing organizations');


  const {folder_id:parent_id} = organizations;

  const folders = await db.query(`
    select f.*, i.*, o.object_type
    from cr_folders f, cr_items i, acs_objects o
    where (item_id = folder_id)
    and (object_id = folder_id)
    and (i.parent_id = $(parent_id))
    order by parent_id;
  `, {parent_id}, {single:false})

  for (folder of folders) {
    const {folder_id, object_type, parent_id, name, label} = folder;
    console.log(`--DELETE ${package_id}:${folder_id}:${object_type} ${parent_id}:${name} "${label}"`)
    await api.content_folder__delete({folder_id})
  };

}
