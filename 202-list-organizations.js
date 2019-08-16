#! /usr/bin/env node

const { openacs } = require('../211-openacs-drive/openacs-drive-api.js');
const {_assert, openacs_cms, tapp} = require('./lib/index');

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('d','folder_id')
  .boolean('commit')
  .options({
    'pg-monitor': {default:true},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
    'zero-auteurs': {default:false}, //
  }).argv;


let {verbose,
  app_folder = process.env.openacs_app_folder
} = argv;
const pg_monitor = (verbose>0);

if (!app_folder) {
  console.log(`
    missing app_folder (driveId)
    `)
  process.exit(-1)
}

async function main() {
  const {db} = await openacs_cms.connect({pg_monitor});

  const app_instance = await tapp.instance_metadata({
    app_folder
  })

console.log(app_instance)


throw 'stop@33'



  dir.items.forEach(file =>{
    const {item_id, revision_id, name, object_title, object_type} =file;
    console.log(`[${item_id}:${revision_id}] <${object_type}> ${object_title}`)
  })

  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
