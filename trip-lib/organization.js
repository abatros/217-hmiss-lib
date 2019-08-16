const {openacs_api:api, tapp, _assert} = require('../lib');
const {state, xnor1} = require('./index.js')

/*
    Organization: (are directly under app_folder.)
      - folder
      - group
*/


module.exports = async (org)=>{
  const {title, url, contact, admin, app_instance} = org;
  let {email, name} = org;
  email = email || (contact && contact.email);
  // console.log(client)

  _assert(app_instance, org, 'Missing app_instance');
  const {package_id, folder_id:app_folder, clients, organizations} =  app_instance;
  const {folder_id: clients_folder} = clients;
  const {folder_id: organizations_folder} = organizations;

  _assert(app_folder, org, 'Missing app_folder');
  _assert(package_id, org, 'Missing package_id');

  _assert(title, org, 'Missing title');
  //name = name || title
  name = xnor1(title); // normalization.

  /**********************************************
      create folder if not exists
  ***********************************************/

  _assert(organizations_folder, org, 'Missing org_folder');

  let folder = await api.content_folder__new({
    parent_id: organizations_folder,
    name,
    label: title,
    // not used content_type: 'tapp-organization',
    object_type: 'hmis-org-folder',
    package_id
  })
  .then(folder_id =>{
      console.log(`folder_id => `,folder_id)
    return {folder_id};
  })
  .catch(async err =>{
//    verbose && show_pg_error(err)
    if (err.code != 23505) throw err;
    console.log(`Organization-folder already exists -- `, err.detail)
    const folder = await api.content_folder__get({parent_id:organizations_folder, name});
    if (!folder) throw 'fatal@30.'
    return folder;
  });


  _assert(folder.folder_id, null, 'Missing folder_id')
  _assert(Number.isInteger(folder.folder_id), null, 'Missing folder_id')

  const {folder_id: org_folder} = folder;

  function split_name(name) {
    name = (name||'').replace(/\s+/g,' ').trim();
    if (name.length <=0) return {first:null, last:null};

//    const i = name.lastIndexOf(' ');
    const found = name.match(/^(.*) ([^\s]*)$/)
    //console.log(`${name} =>`,{found})
    return {first:found[1], last:found[2]};
  }


  if (admin) {
    _assert(Array.isArray(admin), org, 'admin should be an Array')
    for (const _user of admin) {
      const {name, email} = _user; // in case...
      const {first, last} = split_name(name)
      let {first_names=first, last_name=last} = _user;

      _assert(first_names, _user, "Missing first_names")
      _assert(last_name, _user, "Missing last_name")


      const {username=email, screen_name=email} = _user;



      const user = {
        username,
        email,
        first_names,
        last_name,
        screen_name
      };

      //console.log(`@72:`,{user})
      let user_id = await api.acs__add_user(user)
      .catch(async err =>{
        if (err.code != 23505) throw err;
        console.log(`#USER alert:`,err.detail)
        return await db.query(`
          select user_id
          from acs_users_all
          where (email = $(email))
          or (username = $(email));
        `,{email},{single:true})
        .then(({user_id}) =>{
          //console.log(`@83:`,{retv})
          return user_id
        })
        ;
      })

      //console.log(`@80:`,{user_id});
      _assert(user_id, user, 'Invalid user');

      const rel_id = await api.acs_rel__new({
        rel_type: 'hmis-org-admin-rel',
        object_id_one: org_folder,
        object_id_two: user_id,
        context_id: app_folder, // security-context - who can modify this relation ?
        creation_user: null,
        creation_ip: '127.0.0.1',
        package_id // extension.
      })
      .catch(err =>{
        if (err.code != 23505) throw err;
        console.log(`alert@105 `,err.detail)
      })
      rel_id &&
      console.log(`#USER new relation (folder:${org_folder})-(user:${user_id}) =>`,{rel_id})
    } // each membership
  }


  /**********************************************
      create a group : context_id = app_folder.
  ***********************************************/
  state.folder = folder;
  return folder;


}
