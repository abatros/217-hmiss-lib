#! /usr/bin/env node

const { openacs } = require('../211-openacs-drive/openacs-drive-api.js');
const {_assert, openacs_cms, tapp} = require('./lib/index');

const argv = require('yargs')
  .alias('v','verbose').count('verbose')
  .alias('i','instance_name')
  .alias('k','package_id')
  .alias('f','app_folder')
  .options({
    'pg-monitor': {default:true},
    'limit': {default:99999}, // stop when error, if --no-stop, show error.
    'zero-auteurs': {default:false}, //
  }).argv;

const {verbose, package_id,
  app_folder = process.env.openacs_app_folder,
  instance_name} = argv;

async function main() {
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password: process.env.PGPASSWORD,
    verbose
  });

  if (app_folder) {
    await tapp.instance_metadata({
      app_folder
    })
    .then(retv =>{
      console.log(`instance_metadata :`,retv)
    })
    .catch(err =>{
      console.log(`error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
      throw 'FATAL'
    });
  }


  else if (package_id) {
    await tapp.instance_metadata({
      package_id
    })
    .then(retv =>{
      console.log(`instance_metadata :`,retv)
    })
    .catch(err =>{
      console.log(`error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
      throw 'FATAL'
    });
  }


  else {
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
