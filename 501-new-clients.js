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

/**********************
 yaml input file
***********************/

const yaml_fn = argv._[0];
if (!yaml_fn) {
  console.log(`
    missing yaml-file
    `)
  process.exit(-1)
}
const clients_data = yaml.safeLoad(fs.readFileSync(yaml_fn, 'utf8'));
console.log(`> yaml contains ${clients_data.length} clients`)


async function main() {
  const {db} = await openacs_cms.connect({pg_monitor});

  const app_instance = await tapp.instance_metadata({
    app_folder
  })

  console.log(app_instance)
  const {package_id, organizations, clients} = app_instance;
  const {folder_id: clients_folder} = clients;

  /****************************************
  for clients, we an use email for unique identification.
  email will never be seen as email because clients are not users.
  *****************************************/



  for(const client1 of clients_data) {
    const {FirstName:first_names, LastName:last_name, DOB:dob, SSN:ssn} = client1
    let {email} = client1;
    //console.log(client1)
    const person = {
      object_type: 'person',
      first_names, last_name, dob, ssn,
      context_id: clients_folder
    }

//    email = email || hash(person, {algorithm: 'md5', encoding: 'base64' })
    email = email || hash(person,{})

    Object.assign(person,{email})

    let person_id = await tapp.person__new(person)
//    .then(person_id =>{
//      return person_id;
//    })
    .catch(async err =>{
      if (err.code == 23505) {
        console.log('Person already exists : ',err.detail)
      } else {
        throw err;
      }
    });


    if (!person_id) {
      const p = await db.query(`
        select object_id
        from acs_objects, parties
        where (party_id = object_id)
        and (email = $(email));
        `,{email}, {single:true})
      .then(retv =>{
        if (!retv) throw "MISSING PERSON!"
        person_id = retv.object_id;
        console.log(`found person_id:`,person_id)
      })
    }

    // console.log(`person_id:`,person_id)


    /***********************************************
    create the client-folder
    ************************************************/
    await tapp.content_folder__new({
      parent_id: clients_folder,
      name: `${person_id}`,
      label: `${person_id}-${first_names} ${last_name}`,
      description:null,
      package_id,
      context_id: clients_folder
    })
    .catch(err =>{
      if (err.code == 23505) {
        console.log('client-folder already exists : ',err.detail)
      } else {
        throw err;
      }
    })
  }

  /*
  const aclient = await drive.files.create({
    package_id,
    parent_id: app_folder, // at the root
    title: name,
    name
  })
  */

  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
