const massive = require('massive');
const monitor = require('pg-monitor');

// var db; do-not declare => global-context
//var pfolder_id, afolder_id, root_folder_id;

const conn__ = {
  host: process.env.PGHOST || 'ultimheat.com',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  pg_monitor: false
};


const pg_connect = async function (conn) {
  conn = Object.assign(conn__, conn)
  _assert(conn.password, conn, 'Missing password');
  db = await massive(conn);
  if (!db) throw 'Unable to connect.'
  if (conn.pg_monitor) {
    monitor.attach(db.driverConfig);
    console.log(`pg-monitor attached-Ok.`);
  }

  return {db};
}

//connect(); // immediately. so other modules using this will have correct value {db}
//exports.db = db;

const pg_disconnect = async () =>{
  await db.pgp.end();
}

// --------------------------------------------------------------------------
function _assert(b, o, err_message) {
  if (!b) {
    console.log(`######[${err_message}]_ASSERT=>`,o);
    console.trace(`######[${err_message}]_ASSERT`);
    throw {
      message: err_message // {message} to be compatible with other exceptions.
    }
  }
}

module.exports = {
  _assert,
  pg_connect,
  pg_disconnect,
  openacs_api: {
    acs__add_user: require('./acs__add_user.js'),
    acs_group__new: require('./acs_group__new.js'),
    acs_user__delete: require('./acs_user__delete.js'),
    acs_object_type__create_type: require('./acs_object_type__create_type.js'),
    acs_rel_type__create_type: require('./acs_rel_type__create_type.js'),
    acs_rel__new: require('./acs_rel__new.js'),

    application_group__new: require('./application_group__new.js'),
    application_group__group_id_from_package_id: require('./application_group__group_id_from_package_id.js'),
    content_folder__delete: require('./content_folder__delete.js'),
    content_folder__new: require('./content_folder__new.js'),
    content_folder__get: require('./content_folder__get.js'),
    content_folder__register_content_type: require('./content_folder__register_content_type.js'),
    content_item__delete: require('./content_item__delete.js'),
    content_item__new: require('./content_item__new.js'),
    content_item__get: require('./content_item__get.js'),
    content_item__get_content_type: require('./content_item__get_content_type.js'),
    content_item__relate: require('./content_item__relate.js'),
    content_revision__new: require('./content_revision__new.js'),

    group__delete: require('./group__delete.js'),

    membership_rel__new: require('./membership_rel__new.js'),

    person__new: require('./person__new.js'),
    person__delete: require('./person__delete.js'),
    party__delete: require('./party__delete.js'),

    rel_segment__new: require('./rel_segment__new.js')
  },
  tapp: {
    instance_metadata: require('./instance-metadata.js').instance_metadata,
    instance_new: require('./tapp-instance-new.js').instance_new,
  },
  xnor1: (s)=>{
    return s.toLowerCase().replace(/\s+/g,'-'); // should remove accents too.
  }
};

const drive = require('./openacs-drive-api.js')

Object.assign(module.exports, drive);
