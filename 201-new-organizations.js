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

const yaml_fn = argv._[0];
if (!yaml_fn) {
  console.log(`
    missing yaml-file
    `)
  process.exit(-1)
}


if (!app_folder) {
  console.log(`
    missing app_folder (driveId)
    `)
  process.exit(-1)
}

const org_data = yaml.safeLoad(fs.readFileSync(yaml_fn, 'utf8'));
console.log(`> yaml contains ${org_data.length} organizations`)

async function main() {
  const {db} = await openacs_cms.connect({pg_monitor});

  const app_instance = await tapp.instance_metadata({
    app_folder
  })

  console.log(app_instance)
  const {package_id, organizations, clients} = app_instance;


  for(const org1 of org_data) {
    const {title, url, contact} = org1;
    let {email} = org1;
    email = email || (contact && contact.email);
    // console.log(client)

    let folder_id = await tapp.content_folder__new({
      parent_id: organizations.folder_id,
      name: title,
      package_id
    })
    .then(folder_id =>{
//      console.log(`folder_id => `,folder_id)
      return folder_id;
    })
    .catch(err =>{
      verbose && show_pg_error(err)
      if (err.code == 23505) {
        console.log(`Organization-folder already exists -- `,err.detail)
      }
    });

    if (!folder_id) {
//      console.log(`second try.`)
      await tapp.content_folder__get({
        verbose:0,
        parent_id: organizations.folder_id,
        name: title
      })
      .then(folder =>{
        folder_id = folder.folder_id
      })
    }

    _assert(folder_id, null, 'Missing folder_id')
    _assert(Number.isInteger(folder_id), null, 'Missing folder_id')

    /*
      this folder_id can be found as child.
    */

    await create_dummy_programs({title, parent_id:folder_id, package_id});



    /**************************************************

    We need a group for each organization.
    then create rel_segments object:folder_id.
    'tapp-member-rel'
    'tapp-admin-rel'

    In fact a group is also in a context ... folder here. ???
    List all groups in a tapp-instance, how to relate with organization ?
    using context_id => the only way.

    ***************************************************/

    let group_id = await tapp.acs_group__new({
      context_id: folder_id,
      group_name: title,
      email,
      if_exists_get:true
    })
    .then(group_id =>{
      verbose && console.log({group_id})
      return group_id;
    })
    .catch(err =>{
      verbose && show_pg_error(err)
      if (err.code == 23505) {
        console.log(`Group already exists -- `,err.detail)
      }
    });

    /**************************************************

    Create the rel-segments (members, admin)

    ***************************************************/

    _assert(group_id, null, 'Missing group_id')



    /**************************************************

    If there is a contact, add to Users.

    ***************************************************/

    if (contact) {
      const {name, email} = contact;
      let [first_names, last_name, x] = name.split(' ');

      if (x) {
        throw 'Invalid name'
      } else {
        // console.log(`first:${first_names} last:${last_name} email:${email}`)
        const user_id = await tapp.acs__add_user({
            first_names,
            last_name,
            screen_name: email,
            username: email
        })
        .then(user_id =>{
          console.log({user_id})
        })
        .catch(err =>{
          verbose && show_pg_error(err)
          if (err.code == 23505) {
            console.log(`User already exists -- `,err.detail)
          }
        });

        // ADD relation to the app_group

      }
    } // if contact
  } // each organization


  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

function show_pg_error(err) {
  console.log(`error code:${err.code} => ${err.detail}`);
  if (!err.detail) console.log(err)
}

async function create_dummy_programs(cmd) {
  const {title, parent_id, package_id} = cmd;
  for (let i=101; i<=105; i++) {
    await tapp.content_folder__new({
      parent_id,
      name: `p-${i}`,
      label: `program:${i} ${title}`,
      package_id,
      context_id: parent_id
    })
    .catch(err =>{
      if (err.code == 23505) {
        console.log(`program already exists : `,err.detail)
      } else
      throw err;
    })
  }
}


main().catch(console.error)
