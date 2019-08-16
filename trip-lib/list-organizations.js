const {openacs_api:api, tapp, _assert} = require('../lib');

/*

    LIST ORGANIZATIONS
    from app_instance or query on database ?

*/

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder, organizations} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');

//console.log({organizations}) return;

  const {folder_id:parent_id} = organizations;

  const folders = await db.query(`
    select f.*, i.*,
    o.object_type, o.context_id, o.title
    from cr_folders f, cr_items i, acs_objects o
    where (item_id = folder_id)
    and (object_id = folder_id)
    and (i.parent_id = $(parent_id))
    order by parent_id;
  `, {parent_id}, {single:false})

  folders.forEach(folder =>{
    if (verbose) {
      console.log({folder})
    } else {
      const {folder_id, content_type, parent_id, name, label} = folder;
      const {object_id, object_type, context_id, package_id} = folder;
      console.log(`-- ${package_id}:${folder_id}:${object_type} ${parent_id}:${name} "${label}"`)
    }
  })

}
