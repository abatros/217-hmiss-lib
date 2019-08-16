#! /usr/bin/env node


console.log(`
  *********************************************************
  xp101-create-new-instance.js
  for TAPP application.
  We set instance_name == app_folder.name => unique.
  *********************************************************
  `)

const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');

//const { openacs } = require('./openacs-drive-api.js');

//const api = require('./lib/openacs-api')
const {tapp_instance__new} = require('./lib/tapp-instance-new.js')
//console.log('api:',api)
const {_assert, openacs_cms} = require('./lib/index');

if (!process.env.PGPASSWORD) {
  console.log(`
    *********************
    PGPASSWORD IS MISSING
    *********************
    `);
  process.exit(-1);
}

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .boolean('pg-monitor')
  .boolean('commit')
  .options({
    'pg-monitor': {default:false},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
    'zero-auteurs': {default:false}, //
  }).argv;

const verbose = argv.verbose;
const pg_monitor = (verbose>0);
const instance_name = argv._[0] || process.env.instance_name

if (!instance_name) {
  console.log(`
    *****************************************
    FATAL: You must specify an instance-name
    ex: "u2018_fr", "giga_en", etc...
    *****************************************
    `);
  process.exit(-1)
}


console.dir(`Connect database - switching async mode.`)


async function main() {
  const {db} = await openacs_cms.connect({pg_monitor});
  /*
  await api.select_app_instance('jpc-catalogs')
//  await api.select_app_folders('museum-monday-291')
  .then(retv =>{
    if (retv.length !=0) {
      console.log(`ALERT already-exists select_app_instance =>`,retv)
      throw 'fatal@53'
    }
  });
  */

  await tapp_instance__new({
    instance_name
  })

  await openacs_cms.disconnect(db)
  console.dir('Closing connection - Exit: Ok.')
} // main

main()
.catch((err)=>{
  console.log('fatal error in main - err:',err);
  openacs_cms.disconnect()
  console.dir('Closing connection - Exit: Ok.');
})


// -------------------------------------------------------------------------
