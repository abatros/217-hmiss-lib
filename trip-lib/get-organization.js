const {openacs_api:api, tapp, _assert} = require('../lib');
const {state, xnor1} = require('./index.js')

/*
    Organization: (are directly under app_folder.)
      - folder
      - group
*/


module.exports = async (org)=>{
  const {title, url, app_instance} = org;
  let {email,
    name = xnor1(title),
  } = org;

  _assert(app_instance, org, 'Missing app_instance');
  const {package_id, folder_id:app_folder, clients, organizations} =  app_instance;
  const {folder_id: clients_folder} = clients;
  const {folder_id: organizations_folder} = organizations;

  _assert(app_folder, org, 'Missing app_folder');
  _assert(package_id, org, 'Missing package_id');

  _assert(title, org, 'Missing title');
  _assert(name, org, 'Missing name');

  const folder = db.query(`
    select *
    from cr_folders
    join cr_items on (item_id = folder_id)
    join acs_objects on (object_id = folder_id)
    where (parent_id = $(organizations_folder))
    and (name = $(name));
  `, {organizations_folder, name}, {single:true})
  .catch(err =>{
    console.log(err)
    throw err;
  })

  return folder;
}
