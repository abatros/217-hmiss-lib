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

  const app_groups1 = await db.query(`
    select
      g.group_id, group_name, o.object_type, o.context_id,
      o2.object_type as context_type,
      o2.title as context_title,
      p.grantee_id, p.privilege,
      o3.object_type as grantee_type,
      o3.title as grantee_title
    from application_groups ag
    join groups g on (g.group_id = ag.group_id)
    join acs_objects o on (o.object_id = ag.group_id)
    left join acs_objects o2 on (o2.object_id = o.context_id)
    --
    left join acs_permissions p on (p.object_id = ag.group_id)
    left join acs_objects o3 on (o3.object_id = p.grantee_id)
    order by g.group_id
    `,{},{single:false})



  console.log(`found ${app_groups1.length} app_groups1`)
  app_groups1.forEach(it =>{
    console.log(it)
  })


//  console.log(`found ${app_groups.length} (app_group)x(permission)`)

  // find the permissions ending on those groups




  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
