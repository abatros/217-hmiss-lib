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


  const rel_types = [
    {
      rel_type: 'tapp-member-rel',
//      object_type_one: 'tapp-community',
      object_type_one: 'application_group',
      // role-one
      object_type_two: 'user',
      role_two: 'member',
      pretty_name: 'TAPP member',
      pretty_plural: 'TAPP members',
      supertype: 'membership_rel'
    },
    {
      rel_type: 'tapp-admin-rel',
//      object_type_one: 'tapp-community',
      object_type_one: 'application_group',
      // role-one
      object_type_two: 'user',
      role_two: 'admin',
      pretty_name: 'TAPP Administrator',
      pretty_plural: 'TAPP Administrator',
      supertype: 'membership_rel'
    },
    {
      rel_type: 'tapp-org-admin-rel',
      object_type_one: 'content_folder',
      // role-one
      object_type_two: 'user',
      role_two: 'admin',
      pretty_name: 'TAPP Organization Administrator',
      pretty_plural: 'TAPP Organization Administrators',
      supertype: 'membership_rel'
    },
    {
      rel_type: 'tapp-org-staff-rel',
      object_type_one: 'content_folder',
      // role-one
      object_type_two: 'user',
      role_two: 'member',
      pretty_name: 'TAPP Organization Staff',
      pretty_plural: 'TAPP Organization Staff',
      supertype: 'membership_rel'
    },
    {
      rel_type: 'tapp-program-admin-rel',
      object_type_one: 'content_folder',
      // role-one
      object_type_two: 'user',
      role_two: 'admin',
      pretty_name: 'TAPP Program Administrator',
      pretty_plural: 'TAPP Program Administrators',
      supertype: 'membership_rel'
    },
    {
      rel_type: 'tapp-program-staff-rel',
      object_type_one: 'content_folder',
      // role-one
      object_type_two: 'user',
      role_two: 'member',
      pretty_name: 'TAPP Program Staff',
      pretty_plural: 'TAPP Program Staff',
      supertype: 'membership_rel'
    },
  ];

  for (let rel_type of rel_types) {
    //console.log(otype);
    await tapp.acs_rel_type__create_type(rel_type)
    .then(retv =>{
      console.log(`success (${ret_type}) retv:`,retv)
    })
    .catch(err =>{
//      console.log(`catch err:`,err)
      console.log(`catch err.code:${err.code} =>`, err.detail)
    });

  }


  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
