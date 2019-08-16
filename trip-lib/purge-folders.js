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

  const folders = await db.query(`
    select f.*, i.*, o.object_type
    from cr_folders f, cr_items i, acs_objects o
    where (item_id = folder_id)
    and (object_id = folder_id)
    and (o.package_id = $(package_id))
    order by parent_id;
  `, {package_id}, {single:false})


  for (const folder of folders) {
    const {folder_id, object_type, parent_id, name, label} = folder;
    console.log(`-- ${package_id}:${folder_id}:${object_type} ${parent_id}:${name} "${label}"`)
    await db.query(`
      select content_folder__delete($(folder_id), true);
    `,{folder_id},{single:true})
    .catch(err =>{
      console.log(`[purge-folders] Error.code:${err.code} `,err.detail)
      if (err.code == 23503) {
        console.log({folder})
      }
    })
  }

}
