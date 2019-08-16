#! /usr/bin/env node

const fs = require('fs')
const yaml = require('js-yaml');

const { openacs } = require('../211-openacs-drive/openacs-drive-api.js');
const {_assert, openacs_cms, openacs_api:api, tapp} = require('./lib/index');


console.log(`
  This is 888-TRIP
`);

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('i','instance_name')
  .boolean('commit')
  .options({
    'pg-monitor': {default:true},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
  }).argv;


  let {verbose,
    instance_name = process.env.tapp_instance_name
  } = argv;
  const pg_monitor = (verbose>0);

  if (!instance_name) {
    console.log(`
      Missing instance_name.
      use option (-) or
      export tapp_instance_name=<instance-name>

      `)
    process.exit(-1)
  } else {
    console.log(`# Using instance <${instance_name}>`)
  }



  /**********************
      yaml input file
  ***********************/

  const yaml_fn = argv._[0] || './data/trip.yaml';
  if (!yaml_fn) {
    console.log(`
      missing yaml-file
      `)
    process.exit(-1)
  }
  const yaml_data = yaml.safeLoad(fs.readFileSync(yaml_fn, 'utf8'));
  console.log(`> yaml data ${yaml_data.length} records.`)

  const trip = require('./trip-lib');

  async function main() {
    console.log(`connecting...`);
    const {db} = await openacs_cms.connect({pg_monitor});
    console.log(`connected.`)

    /***********************************
     (app_folder.name == instance_name)
    ************************************/

    const app_instance = await tapp.instance_metadata({instance_name})
    _assert(app_instance, "FATAL@69 Missing app_instance")

    const {folder_id:app_folder, package_id, name} = app_instance;
    _assert(app_folder, "FATAL@69 Missing app_folder")

console.log({app_instance})

    let {clients, organizations, groups} = app_instance;

    if (!organizations) {
      // create top-folder.
      const folder_id = await api.content_folder__new({
        name: `organizations-folder`,
        label: `organizations-folder tapp-instance:${package_id}`,
        description: 'organizations-folder for tapp-instance: '+instance_name,
        parent_id: app_folder,
        context_id: null,
        folder_id: null,
        creation_date: new Date(),
        creation_user: null,
        creation_ip: '127.0.0.1',
        package_id,
      })

    console.log({folder_id})

    organizations = api.content_folder__get(folder_id)
    }


    _assert(organizations, app_instance, "FATAL@53 Missing organizations")
    _assert(clients, app_instance, "FATAL@53 Missing client-folder")
    _assert(groups, app_instance, "FATAL@53 Missing groups")

    let nitems =0;
    outerLoop:
    for(const record of yaml_data) {
      const {otype, skip} = record;
      nitems +=1;
      if (skip) continue;
      Object.assign(record,{app_instance});
      console.log(`--${nitems}--[${otype}]`)
      switch(otype) {
        case 'acs-object-type': await api.acs_object_type__create_type(record); break;
        case 'acs-rel-type': await api.acs_rel_type__create_type(record); break;
        case 'exit': break outerLoop;
        case 'list-folders': await trip.list_folders(record); break;
        case 'list-organizations': await trip.list_organizations(record); break;
        case 'list-programs': await trip.list_programs(record); break;
        case 'list-users': await trip.list_users(record); break;
        case 'list-clients': await trip.list_clients(record); break;
        case 'list-clients-revisions': await trip.list_clients_revisions(record); break;
        case 'client': await trip.client(record); break;
        case 'organization': await trip.organization(record); break;
        case 'program': await trip.program(record); break;
        case 'purge-clients': await trip.purge_clients(record); break;
        case 'purge-folders': await trip.purge_folders(record); break;
        case 'purge-groups': await trip.purge_groups(record); break;
        case 'purge-organizations': await trip.purge_organizations(record); break;
        case 'purge-programs': await trip.purge_programs(record); break;
        case 'repair-instance': await trip.repair_instance(record); break;
        case 'user': await trip.user(record); break;
        case 'xray-instance': await trip.xray_instance(record); break;
        default:
          if (otype.startsWith('-')) continue outerLoop;
          console.log(`
            Invalid object_type (${otype}) found in yaml.
          `)
          throw 'STOP@61'
      }
    }

    console.log(`stopped at ${nitems}:${yaml_data.length}`)
    console.log(`disconnecting...`);
    await openacs.disconnect();
    console.log(`disconnected -exit- Ok.`)
  }; // main.

  function show_pg_error(err) {
    console.log(`error code:${err.code} => ${err.detail}`);
    if (!err.detail) console.log(err)
  }

main().catch(console.error)
