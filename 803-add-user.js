#! /usr/bin/env node

const fs = require('fs')
const yaml = require('js-yaml');

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

let {verbose, app_folder} = argv;
app_folder = app_folder || process.env.openacs_app_folder
const pg_monitor = (verbose>0);
//const app_folder = 407848;

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
  const {package_id, organizations, clients} = app_instance;

  const user_id = await tapp.acs__add_user({
      first_names: 'jules',
      last_name: 'cesar',
      username: 'jules.cesar3',
      screen_name: 'jules709'
    })
    .then(user_id =>{
      console.log({user_id})
    })
    .catch(err =>{
        console.log(`error code:${err.code} => ${err.detail}`);
        if (!err.detail) console.log(err)
    });




  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
