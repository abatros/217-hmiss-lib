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
const [folder_id, name] = argv._;

if (!folder_id) {
  console.log(`
    missing folder_id (organization)
    `)
  process.exit(-1)
}

if (!name) {
  console.log(`
    missing name
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
    folder_id: 407848,
    verbose
  });

  verbose &&
  console.log('found drive1 (app-instance):',drive1);

  const {package_id, app_folder} = drive1;

  const project1 = await drive.files.create_folder({
    package_id,
    parent_id: folder_id, // from organization
    title: name,
    name
  })


  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
