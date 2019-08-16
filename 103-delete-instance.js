#! /usr/bin/env node

const { openacs } = require('../211-openacs-drive/openacs-drive-api.js');

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('i','instance_name')
  .alias('k','package_id')
  .alias('a','app_folder')
  .options({
    'pg-monitor': {default:true},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
    'zero-auteurs': {default:false}, //
  }).argv;

const {verbose, package_id, app_folder, instance_name} = argv;

async function main() {
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password: process.env.PGPASSWORD,
    verbose
  });


  if (package_id) {
    await db.query(`
      select apm_application__delete($(package_id));
      `,{package_id},{single:true})
  } else {
    console.log(`
      you must give either:
      package_id (-k)
      app_folder (-f)
      instance_name (i)
      `)
  }

  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
