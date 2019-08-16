#! /usr/bin/env node

const fs = require('fs')
const yaml = require('js-yaml');

const { openacs, _assert } = require('../211-openacs-drive/openacs-drive-api.js');

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('d','folder_id')
  .boolean('commit')
  .options({
    'pg-monitor': {default:true},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
    'zero-auteurs': {default:false}, //
  }).argv;

const {verbose} = argv;
const yaml_fn = argv._[0];

if (!yaml_fn) {
  console.log(`
    missing yaml file.
    `)
  process.exit(-1)
}

const clients_data = yaml.safeLoad(fs.readFileSync(yaml_fn, 'utf8'));

//verbose &&
console.log(`> yaml contains ${clients_data.length} clients`)


async function main() {

  const {PGPASSWORD:password, openacs_app_folder, project_id, client_id, org_id} = process.env;
  _assert(project_id, process.env, 'Missing project_id')

  console.log(`connecting...`)
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password: process.env.PGPASSWORD,
    verbose
  });

  const drive1 = await drive.drives.get({
    folder_id: openacs_app_folder,
    verbose
  });

  console.log(`connected.`)
  verbose &&
  console.log('found drive1 (app-instance):',drive1);

  const {package_id, app_folder} = drive1;

  const clients_folder = await db.query(`
    select * from cr_folders, cr_items
    where (item_id = folder_id)
    and parent_id = $(app_folder) and name = 'clients-folder';
    `, {app_folder}, {single:true})
  .then(retv =>{
    console.log(`found <clients-folder> at retv:`,retv)
    console.log(`found <clients-folder> at folder_id:`,retv.folder_id)
    return retv;
  })
  .catch(async err =>{
    console.log(`Error code:${err.code} =>${err.detail}`)
    const clients_folder = await drive.files.create_folder({
      package_id,
      parent_id: app_folder, // from organization
      name: 'clients-folder',
      title: 'Clients Folder',
      label: 'Clients Folder'
    })
    .then(retv =>{
      console.log(`Create <clients-folder> success. retv:`,retv)
    })
    .catch(err =>{
      console.log(`Error code:${err.code} =>${err.detail}`)
    })

  })




  for(const client of clients_data) {
    // console.log(client)

    Object.assign(client, {
      item_id: null,
      parent_id: clients_folder.item_id,
      name: client.SSN,
      locale: 'us',
      creation_date: new Date(),
      creation_user: undefined,
      creation_ip: 'localhost',
      context_id: clients_folder.item_id,
      item_subtype: 'hmis-client',
      content_type: 'content_revision',
      title: 'title:'+client.name,
      description: 'no-description-yet',
      mime_type: undefined,
      nls_language: undefined,
      text: JSON.stringify(client),
      data: null,
      relation_tag: null,
      is_live: true,
      storage_type: 'text',
      package_id,
      with_child_rels: undefined
    })

    await db.query(`
      select content_item__new(
        $(name),
        $(parent_id),
        $(item_id),
        $(locale),
        $(creation_date),
        $(creation_user),
        $(context_id),
        $(creation_ip),
        $(item_subtype),
        $(content_type),
        $(title),
        $(description),
        $(mime_type),
        $(nls_language),
        $(text),
        $(data),
        $(relation_tag),
        $(is_live),
        $(storage_type),
        $(package_id),
        $(with_child_rels)) as item_id;
    `,client, {single:true})
    .then(retv =>{
      console.log(`content_item__new => item_id:${retv.item_id}`)
    })
    .catch(err =>{
      console.log(`error code:${err.code} =>${err.detail}`)
    })
  }


  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
