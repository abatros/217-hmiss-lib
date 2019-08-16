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

  const clients = await db.query(`
    select *
    from cr_folders
    join cr_items on (item_id = folder_id)
    where (parent_id = $(parent_id));
  `, {package_id, parent_id}, {single:false})

  clients.forEach(client =>{
    const {folder_id, name, title, label} = client;
    console.log(`-- ${folder_id} [name]:${name} [label]:${label}`)
  })


}
