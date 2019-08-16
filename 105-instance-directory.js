#! /usr/bin/env node

const { openacs } = require('../211-openacs-drive/openacs-drive-api.js');
const {_assert, openacs_cms, tapp} = require('./lib/index');

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('i','instance_name')
  .alias('k','package_id')
  .alias('f','app_folder')
  .options({
    'pg-monitor': {default:true},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
    'zero-auteurs': {default:false}, //
  }).argv;

const {verbose, package_id,
  app_folder = process.env.openacs_app_folder,
  instance_name
} = argv;

if (!app_folder) {
  console.log(`
    Missing app_folder
    `);
  process.exit(-1)
}


async function main() {
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password: process.env.PGPASSWORD,
    verbose
  });

  if (app_folder) {
    const tapp_instance = await tapp.instance_metadata({
      app_folder
    })
    .then(retv =>{
      return retv;
    })
    .catch(err =>{
      console.log(`error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
      throw 'FATAL'
    });

    await view_tapp_directory(tapp_instance);

  }


  else if (package_id) {
    const tapp_instance = await tapp.instance_metadata({
      package_id
    })
    .then(retv =>{
      return retv;
    })
    .catch(err =>{
      console.log(`error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
      throw 'FATAL'
    });

  }


  else {
    console.log(`
      you must give either:
      package_id (-k)
      app_folder (-f)
      instance_name (i)
      `)
  }

  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

async function view_tapp_directory(tapp_instance) {
  console.log(`view_instance_metadata :`, tapp_instance)
  const {folder_id, package_id, organizations, clients, groups} = tapp_instance;
  const {folder_id: clients_folder} = clients;

  _assert(folder_id, tapp_instance, 'Missing folder_id')
  _assert(package_id, tapp_instance, 'Missing package_id')
  _assert(organizations, tapp_instance, 'Missing organizations')
  _assert(clients, tapp_instance, 'Missing clients')
  _assert(groups, tapp_instance, 'Missing groups')

  // Organizations


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

  await db.query(`
    select * from
    cr_folders, cr_items
    where (folder_id = item_id)
    and (parent_id = $(parent_id))
    ;
    `,{parent_id:clients.folder_id},{single:false})
  .then(clients => {
    console.log(`found ${clients.length} client-folder`)
    clients.forEach(client =>{
      const {folder_id, label, name, content_type, object_type} = client;
      console.log(`-- ${folder_id}:<${name}> "${label}" content_type:${content_type}/${object_type}`)
    })
    console.log(`found ${clients.length} clients-folder`)
  })


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


  console.log(`found ${persons.length} clients`);
  persons.forEach(p =>{
    const {person_id, first_names, last_name, email, package_id, context_id, object_type} = p;
    console.log(`-- ${person_id} ${first_names} ${last_name} <${email}> ${package_id}::${context_id} [${object_type}]`)
  })
  console.log(`found ${persons.length} clients`);



}


main().catch(console.error)
