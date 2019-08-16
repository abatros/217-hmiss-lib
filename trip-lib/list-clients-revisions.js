const {openacs_api:api, tapp, _assert} = require('../lib');

/*

  LIST CLIENTS having relation with anything in this APP_INSTANCE
  each client has a folder (object-type = 'hmis-client-folder')
  Note they are all under 'clients-folders'...
*/

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder, clients:clients_folder} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');
  _assert(clients_folder, o, 'Missing app_instance.clients');

  const {folder_id: parent_id} = clients_folder;

  const revisions = await db.query(`
    select
      revision_id, i.item_id, i.name, r.title, object_type, context_id, checksum, content_type
    from cr_revisions r
    join cr_items i on (i.item_id = r.item_id)
    join acs_objects o on (object_id = revision_id)
    where (package_id = $(package_id))
    order by i.item_id, revision_id;
  `, {package_id, parent_id}, {single:false})

  /************************************************************

  THIS GETS REVISIONS ON ALL OBJECTS IN THE INSTANCE.
  HOW TO GET ONLY CLIENTS DOC REVISIONS. ??????

  *************************************************************/

  revisions.forEach(revision =>{
    const {item_id, revision_id, name, title, context_id} = revision;
//    console.log(`-- `,{item_id, revision_id, name, title, context_id})
    console.log(`-- ${item_id}:${revision_id} [item.name]:${name} [rev.title]:${title} context:${context_id}`)
  })


}
