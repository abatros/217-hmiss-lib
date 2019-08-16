#! /usr/bin/env node

const fs = require('fs')
const yaml = require('js-yaml');
const hash = require('object-hash');

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

async function main() {
  const {db} = await openacs_cms.connect({pg_monitor});

  const app_instance = await tapp.instance_metadata({
    app_folder
  })

  console.log(app_instance)
  const {package_id, organizations, clients} = app_instance;
  const {folder_id: clients_folder} = clients;

  const persons = await db.query(`
    select *
    from persons, parties, acs_objects
    where (party_id = person_id)
    and (object_id = person_id)
    and (object_type = 'person')
    and (context_id = $(clients_folder))
    order by person_id;
    `, {clients_folder}, {single:false})
  .catch(async err =>{
    console.log(`Error code:${err.code} =>${err.detail}`)
    throw 'fatal@42'
  })


  console.log(`found ${persons.length} persons`);
  for (const p of persons) {
    const {person_id, first_names, last_name, email, package_id, context_id, object_type} = p;
    console.log(`-- ${person_id} ${first_names} ${last_name} <${email}> ${package_id}::${context_id} [${object_type}]`)
    await tapp.person__delete(person_id)
  }

  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
