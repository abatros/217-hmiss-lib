#! /usr/bin/env node

const fs = require('fs')
const yaml = require('js-yaml');
// const {xnor1, xnor2, xnor3} = require('./lib/utils')

const { openacs, _assert } = require('../211-openacs-drive/openacs-drive-api.js');

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
const yaml_fn = argv._[0];

if (!yaml_fn) {
  console.log(`
    missing funder yaml-file name
    `)
  process.exit(-1)
}

const {PGPASSWORD:password, project_id, client_id, org_id} = process.env;

const file_data = yaml.safeLoad(fs.readFileSync(yaml_fn, 'utf8'));

verbose &&
console.log(`file_data:`,file_data)

const {content_type, name} = file_data;

_assert(content_type, file_data, 'Missing content-type')
_assert(name, file_data, 'Missing file-name')
_assert(project_id, process.env, 'Missing project_id')
_assert(client_id, process.env, 'Missing client_id')

/*******************************************************

  here we must link enrollment to a client or to a project
  Question: delete client or delete project... what to do.

********************************************************/


async function main() {
  const drive = await openacs.drive({
    version: 'v3',
  //  auth: oAuth2Client,
    password,
    verbose
  });

  const drive1 = await drive.drives.get({
    folder_id: 407848,
    verbose
  });

  verbose &&
  console.log('found drive1 (app-instance):',drive1);

  const {package_id, app_folder} = drive1;

  const project1 = await drive.files.create({
    package_id,
    parent_id: project_id, // from project
    name,
    title: `${content_type}-${name}`,
    description: `${content_type}-${name}`,
    text: JSON.stringify(file_data)
  })


  console.log(`disconnecting...`);
  await openacs.disconnect();
  console.log(`disconnected -exit- Ok.`)
}

main().catch(console.error)
