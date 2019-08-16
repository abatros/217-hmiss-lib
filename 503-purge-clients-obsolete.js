#! /usr/bin/env node

const { openacs } = require('../211-openacs-drive/openacs-drive-api.js');

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
const folder_id = argv._[0]; // organization

async function main() {
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password: process.env.PGPASSWORD,
    verbose
  });

  const drive1 = await drive.drives.get({
    package_id:407847, // HMIS instance
    verbose
  });

  verbose &&
  console.log('found drive1 (app-instance):',drive1);

  const {package_id, app_folder} = drive1;

  const clients_folder = await db.query(`
    select * from cr_folders, cr_items
    where (item_id = folder_id)
    and parent_id = $(app_folder) and name = 'clients-folder';
    `, {app_folder}, {single:true})
  .then(retv =>{
    console.log(`found <clients-folder> at folder_id:`,retv.folder_id)
    return retv;
  })
  .catch(async err =>{
    console.log(`Error code:${err.code} =>${err.detail}`)
    process.exit(-1);
  })

  await db.query(`
    delete from acs_objects
    where context_id = $1;
    `, [clients_folder.item_id], {single:true})
  .then(retv =>{
    console.log(`purge Ok `,retv)
    return retv;
  })
  .catch(async err =>{
    console.log(`Error code:${err.code} =>${err.detail}`)
    process.exit(-1);
  })



  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
