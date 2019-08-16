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

async function main() {
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password: process.env.PGPASSWORD,
    verbose
  });

  const otypes = [
    {
      object_type: 'hmis-client',
      pretty_name: 'HMIS Client',
      pretty_plural: 'HMIS Clients',
      supertype: 'acs_object',
      table_name: undefined,
      id_column: undefined,
      package_name: undefined,
      abstract_p: false,
      type_extension_table: undefined,
      name_method: undefined
    },
    {
      object_type: 'hmis-org',
      pretty_name: 'HMIS Organization',
      pretty_plural: 'HMIS Organizations',
      supertype: 'acs_object',
      table_name: undefined,
      id_column: undefined,
      package_name: undefined,
      abstract_p: false,
      type_extension_table: undefined,
      name_method: undefined
    },
    {
      object_type: 'hmis-project',
      pretty_name: 'HMIS Project',
      pretty_plural: 'HMIS Projects',
      supertype: 'acs_object',
      table_name: undefined,
      id_column: undefined,
      package_name: undefined,
      abstract_p: false,
      type_extension_table: undefined,
      name_method: undefined
    },
    {
      object_type: 'hmis-enrollment',
      pretty_name: 'HMIS Enrollment',
      pretty_plural: 'HMIS Enrollments',
      supertype: 'acs_object',
      table_name: undefined,
      id_column: undefined,
      package_name: undefined,
      abstract_p: false,
      type_extension_table: undefined,
      name_method: undefined
    },
    {
      object_type: 'tapp-community',
      pretty_name: 'TAPP Community',
      pretty_plural: 'TAPP Communities',
      supertype: 'application_group',
      table_name: undefined,
      id_column: undefined,
      package_name: undefined,
      abstract_p: false,
      type_extension_table: undefined,
      name_method: undefined
    },
  ];

  for (let otype of otypes) {
    //console.log(otype);
    const retv = await db.query(`select acs_object_type__create_type(
      $(object_type),
      $(pretty_name),
      $(pretty_plural),
      $(supertype),
      $(table_name),
      $(id_column),
      $(package_name),
      $(abstract_p),
      $(type_extension_table),
      $(name_method));
      `, otype, {single:true})
      .then(retv =>{
        console.log('retv:',retv)
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
