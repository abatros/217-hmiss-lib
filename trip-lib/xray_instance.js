const {openacs_api:api, tapp, _assert} = require('../lib');
const register_organization = require('./organization.js')

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  const {folder_id:app_folder, package_id, organizations, clients, groups} = app_instance;
  console.log(`[xray-instance] o:`,o)

  // list organizations:

  await view_tapp_directory(app_instance)


}

async function view_tapp_directory(tapp_instance) {
  //console.log(`view_instance_metadata :`, tapp_instance)
  const {folder_id:app_folder, package_id, organizations, clients, groups} = tapp_instance;

  _assert(app_folder, tapp_instance, 'Missing folder_id')
  _assert(package_id, tapp_instance, 'Missing package_id')

  // TOP-LEVEL FOLDERS : ORGANIZATIONS, CLIENTS

  await db.query(`
    select f.*, i.*, o.object_type
    from cr_folders f, cr_items i, acs_objects o
    where (folder_id = item_id)
    and (folder_id = object_id)
    and (parent_id = $(app_folder));
    `,{app_folder},{single:false})
  .then(folders => {
    console.log(`found ${folders.length} top-folders`)
    folders.forEach(folder =>{
      const {folder_id, label, name, content_type, object_type} = folder;
      console.log(`-- ${folder_id}:<${name}> "${label}" content_type:${content_type}/${object_type}`)
    })
    if (folders.length != 0) {
      console.error(`[xray-instance] alert top-folders != 2`)
    }
  })



  if (!organizations) {
    console.log(`[xray-instances] NO ORGANIZATIONS.`)
  } else {
    const {folder_id: organizations_folder} = organizations;
    _assert(organizations_folder, tapp_instance, 'Missing organizations-folder')

    await db.query(`
      select f.*, i.*, o.object_type
      from cr_folders f, cr_items i, acs_objects o
      where (folder_id = item_id)
      and (folder_id = object_id)
      and (parent_id = $(parent_id));
      `,{parent_id:organizations.folder_id},{single:false})
    .then(orgs => {
      console.log(`found ${orgs.length} organizations`)
      orgs.forEach(org =>{
        const {folder_id, label, name, content_type, object_type} = org;
        console.log(`-- ${folder_id}:<${name}> "${label}" content_type:${content_type}/${object_type}`)
      })
    })
  }


  if (!clients) {
    console.log(`[xray-instances] NO CLIENTS.`)
  }
  else {
    const {folder_id: clients_folder} = clients;
    _assert(clients_folder, tapp_instance, 'Missing clients-folder')


    await db.query(`
      select * from
      cr_folders, cr_items
      where (folder_id = item_id)
      and (parent_id = $(parent_id))
      ;
      `,{parent_id:clients.folder_id},{single:false})
    .then(clients => {
      console.log(`found ${clients.length} client-folders`)
      clients.forEach(client =>{
        const {folder_id, label, name, content_type, object_type} = client;
        console.log(`-- ${folder_id}:<${name}> "${label}" content_type:${content_type}/${object_type}`)
      })
      console.log(`found ${clients.length} clients-folders`)
    })


    // are in the client context.

    const persons = await db.query(`
      select *
      from persons, parties, acs_objects
      where (party_id = person_id)
      and (object_id = person_id)
      and (context_id = $(clients_folder))
      order by person_id;
      `, {clients_folder}, {single:false})
    .catch(async err =>{
      console.log(`Error code:${err.code} =>${err.detail}`)
      throw 'fatal@42'
    })


    console.log(`found ${persons.length} clients in table persons`);
    persons.forEach(p =>{
      const {person_id, first_names, last_name, email, package_id, context_id, object_type} = p;
      console.log(`-- ${person_id} ${first_names} ${last_name} <${email}> ${package_id}::${context_id} [${object_type}]`)
    })
    console.log(`found ${persons.length} clients in table persons`);


  }

  /********************************************

    show all programs
    and their organization...

  *********************************************/

  const programs = await db.query(`
    select f.*, i.*, o.object_type
    from cr_folders f, cr_items i, acs_objects o
    where (item_id = folder_id)
    and (object_id = folder_id)
    and ((object_type = 'tapp-program') or (object_type = 'hmis-program'))
    and (o.package_id = $(package_id));
  `, {package_id}, {single:false})
  .then(programs =>{
    console.log({programs})
  })



  console.log(`todo: showing groups in app_folder security-context`)
  const app_groups = await db.query(`
    select * from groups
    join acs_objects o on (o.object_id = group_id)
    where(context_id = $(app_folder))
  `,{app_folder},{single:false})
  console.log({app_groups})


  const acs_rels = await db.query(`
    select rel_id, rel_type,
      o1.object_type as object_type1, object_id_one,
	    o2.object_type as object_type2, object_id_two
    from acs_rels
    join acs_objects o on (o.object_id = rel_id)
    join acs_objects o1 on (o1.object_id = object_id_one)
    join acs_objects o2 on (o2.object_id = object_id_two)
    where (o.context_id = $(app_folder))
  `,{app_folder},{single:false})

  acs_rels.forEach(rel =>{
    const {rel_id, rel_type, object_type1, object_id_one, object_type2, object_id_two} = rel;
    console.log(`-- ${rel_id} <${rel_type}> (${object_type1}:${object_id_one})-(${object_type2}:${object_id_two})`)
  })

}
