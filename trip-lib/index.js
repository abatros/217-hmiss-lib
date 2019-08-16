module.exports.state = {
  user:null,
  organization:null,
  program:null,
  client:null
};

module.exports.xnor1 = (s)=>{
  return s.toLowerCase().replace(/\s+/g,'-'); // should remove accents too.
}

module.exports.user = require('./user.js')
module.exports.client = require('./client.js')
module.exports.organization = require('./organization.js')
//module.exports.create_instance = require('./create-instance.js')
module.exports.repair_instance = require('./repair-instance.js')
module.exports.xray_instance = require('./xray_instance.js')
module.exports.program = require('./program.js')
module.exports.purge_programs = require('./purge-programs.js')
module.exports.purge_folders = require('./purge-folders.js')
module.exports.list_folders = require('./list-folders.js')
module.exports.list_organizations = require('./list-organizations.js')
module.exports.list_programs = require('./list-programs.js')
module.exports.list_users = require('./list-users.js')
module.exports.list_clients = require('./list-clients.js')
module.exports.list_clients_revisions = require('./list-clients-revisions.js')
module.exports.purge_clients = require('./purge-clients.js')
module.exports.purge_groups = require('./purge-groups.js')
module.exports.purge_organizations = require('./purge-organizations.js')
module.exports.get_organization = require('./get-organization.js')
