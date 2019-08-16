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

if (!folder_id) {
  console.log(`
    missing organization folder_id
    `)
  process.exit(-1)
}

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

  const dir = await drive.files.list({
    parent_id:folder_id, // organization
    maxResults: 9999,
    orderBy: 'item_id desc',
    pageToken: undefined,
    q: undefined,
    spaces: 'drive' // appDataFolder or photos...
  });


  dir.items.forEach(file =>{
    const {item_id, revision_id, name, object_title, object_type} =file;
    console.log(`[${item_id}:${revision_id}] <${object_type}> ${object_title}`)
  })

  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
