const {openacs_api:api, tapp, _assert} = require('../lib');
const {state, xnor1, organization} = require('./index.js');
/*

  Note: organization parent is not mandatory.
  WHY:
    - a program can be moved to another organization
    - it's always possible to add an organization later.
    - if the org is missing, we take the latest org explicitely defined.

   Program <==> Project
      - folder
      - group
*/


module.exports = async (project)=>{
  const {title, url, contact, app_instance, org_title} = project;
  let {email,
    name = xnor1(title),
  } = project;

  if (contact) {
    throw 'Manage the contact-first!'
    email = email || (contact && contact.email);
  }

  // console.log(client)

  _assert(app_instance, project, 'Missing app_instance');
  const {package_id, folder_id:app_folder, clients, organizations} =  app_instance;
  const {folder_id: clients_folder} = clients;
  const {folder_id: organizations_folder} = organizations;

  _assert(app_folder, project, 'Missing app_folder');
  _assert(package_id, project, 'Missing package_id');
  _assert(title, project, 'Missing program-title');
  _assert(name, project, 'Missing program-name');

  let org = state.organization;


  if (project.organization) {
    org = await organization(Object.assign(project.organization, {app_instance}))
    //console.log({org})
  }

  _assert(org, project, 'Missing org@48');

  /**********************************************
      create program-folder
  ***********************************************/

  _assert(organizations_folder, org, 'Missing org_folder');

  let folder = await api.content_folder__new({
    parent_id: organizations_folder,
    name,
    label: title,
    object_type: 'hmis-project',
    package_id
  })
  .then(folder_id =>{
      console.log(`folder_id => `,folder_id)
    return {folder_id};
  })
  .catch(async err =>{
//    verbose && show_pg_error(err)
    if (err.code != 23505) throw err;
    console.log(`project-folder already exists -- `, err.detail)
    const folder = await api.content_folder__get({parent_id:organizations_folder, name});
    if (!folder) throw '[program] fatal@75.'
    return folder;
  });


  _assert(folder.folder_id, null, 'Missing folder_id')
  _assert(Number.isInteger(folder.folder_id), null, 'Missing folder_id')

  /**********************************************
      create a group : context_id = app_folder.
  ***********************************************/

  return folder;


}
