const massive = require('massive');
const monitor = require('pg-monitor');

// var db; do-not declare => global-context
//var pfolder_id, afolder_id, root_folder_id;

const conn__ = {
  host: process.env.DB_HOST || 'ultimheat.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'openacs-cms',
  user: process.env.DB_USER || 'postgres',
//  password: process.env.DB_PASS || process.env.PGPASSWORD,
  pg_monitor: false,
  password: process.env.PGPASSWORD
};


async function connect(conn) {

  conn = Object.assign(conn__, conn)
  if (!conn.password) throw 'Missing password';

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

async function disconnect() {
  await db.pgp.end();
}

// --------------------------------------------------------------------------
/*
Lists the user's shared drives
*/

async function list_drives(o) {
  o = o||{};
  const {
    maxResults =10, // default
    pageToken,
    q,
    useDomainAdminAccess =false,
    verbose
  } =o;

  /*****************************************************************
  That should be list drives for a specific user or application
  In openacs, each user can mount an application content-repository.
  For now, we list all cms/drive instances.
  ******************************************************************/

  return db.query(`
    -- make sure the app does not exists:

    select f.folder_id, i.parent_id, i.name, f.label, f.package_id, p.instance_name, p.package_key
    from cr_folders f
    join apm_packages p on (p.package_id = f.package_id)
    join cr_items i on (i.item_id = f.folder_id)
    where ((p.package_key = 'cms')or(p.package_key = 'museum'))
    and parent_id = -100
    `,[],{single:false})
  .then(apps =>{
    if (verbose) {
      console.log(apps)
    } else {
      apps.forEach(app =>{
        const {package_id, folder_id, name, label, instance_name} = app;
        //console.log(`[${package_id},${folder_id}] "${instance_name}"`)
      })
    }
    return {
      kind: 'openacs-drive#list',
      nextPageToken: null, // This will be absent if the end of the list has been reached
      items: apps
    }
  });

}

// --------------------------------------------------------------------------

/*
    Gets a shared drive's metadata by ID.(name)
    scopes allowed:
    https://www.googleapis.com/auth/drive
    https://www.googleapis.com/auth/drive.readonly
*/

async function get_drive_metadata(o) {
  o = o||{};
  const {package_id, folder_id, instance_name, name, verbose} =o;
  const {
    driveId, // google
    useDomainAdminAccess =false
  } =o;

  function repack(retv) {
    const {package_id, package_key, label, parent_id, name, folder_id:app_folder} = retv;
    return {
      package_id,
      app_folder, // root folder for the drive.
      package_key,
      instance_name,
      label,
      parent_id,
      name,
      kind: 'drive#drive-metadata',
    };
  }

  if (folder_id) {
    const drive_app = await db.query(`
      select * from cms.app_instances where folder_id = $1;
      `, [folder_id], {single:true})
    if (!drive_app) {
      return null;
    }
    return repack(drive_app);
  }

  if (package_id) {
    const drive_app = await db.query(`
      select * from cms.app_instances where package_id = $1;
      `, [package_id], {single:true})
    return repack(drive_app);
  }


//  let {instance_name} =o;
//  instance_name = instance_name || name || driveId;
  if (!instance_name) throw 'Missing deiveId/name';

  return db.query(`
    select * from cms.app_instances where instance_name = $1;
    `, [instance_name], {single:false})
  .then(apps =>{
    if (apps.length == 1) {
      app = apps[0]; // global.
      verbose &&
      console.log(`found app:`,app)
      const {package_id, package_key, label, parent_id, name, folder_id:app_folder} = app; // global variable.

      return {
        // openacs
        package_id,
        app_folder, // root folder for the drive.
        package_key,
        instance_name,
        label,
        parent_id,
        name,
        // googleapi
        kind: 'drive#drive-metadata',
        driveId: app_folder,
        backgroundImageFile: null,
        backgroundImageLink: null,
        capabilities: { // for-info. Not real-permissions.
          canAddChildren: undefined,
          canChangeCopyRequiresWriterPermissionRestriction: undefined,
          canChangeDomainUsersOnlyRestriction: undefined,
          canChangeDriveBackground: undefined,
          canChangeDriveMembersOnlyRestriction: undefined,
          canComment: undefined,
          canCopy: undefined,
          canDeleteChildren: undefined,
          canDeleteDrive: undefined,
          canDownload: undefined,
          canEdit: undefined,
          canListChildren: undefined,
          canManageMembers: undefined,
          canReadRevisions: undefined,
          canRename: undefined,
          canRenameDrive: undefined,
          canShare: undefined,
          canTrashChildren: undefined
        },
        createdDate: undefined,
        hidden: undefined,
        restrictions: {
          adminManagedRestrictions: undefined,
          copyRequiresWriterPermission: undefined,
          domainUsersOnly: undefined,
          driveMembersOnly: undefined
        }
      }
    } else {
      console.log(`found ${apps.length} apps:`,apps)
      throw 'stop@100';
    }
  })
}

// --------------------------------------------------------------------------
/*
ETAG : https://hexdocs.pm/google_api_iam/GoogleApi.IAM.V1.Model.Policy.html
*/

async function list_files(o) {
  o = o||{};
  const {parent_id, verbose} =o;
  const {
    driveId,
    maxResults,
    orderBy,
    pageToken,
    q,
    spaces,
  } =o;

  if (!parent_id) throw 'Missing parent_id@217';

  const _orderBy = (orderBy)? `order by ${orderBy}`: ''

  const files = await db.query(`
    -- drive.files.list
  select
    i.item_id,
    revision_id,
    object_type,
    description,
    path,
    name,
    r.title,
    o.title as object_title,
    object_type,
    data -- should be in fields selection
  from cr_items i
  join acs_objects o on (o.object_id = i.item_id)
  left join cr_revisions r on (r.revision_id = i.latest_revision)
  where (i.parent_id = $(parent_id))
  ${_orderBy};
  `,{parent_id}, {single:false})
  .then(files =>{
    //console.log(`> found ${files.length} files. files:`,files)
    return files;
  });


  /********************************************
    Catalogs are direct children in app_folder
  *********************************************/
  /*
  for (let cat of catalogs) {
    const {item_id, revision_id, name, path:ipath, h1, data, object_type, title} = cat;
    console.log(`[${item_id}:${revision_id}:${name}] ${object_type} @(${ipath}) "${title}"`)
  }*/


  return {
    kind: 'drive#fileList',
    etag: undefined, // optimistic concurrency control as a way to help prevent simultaneous updates of a policy from overwriting each other
    selflink: undefined,
    nextPageToken: null, // means no more page of files.
    nextLink: undefined,
    incompleteSearch: false, // true if quota or limits reached.
    items: files
  }

}



// --------------------------------------------------------------------------

async function get_file_metadata(o) {
  o = o||{};
  const {
    fileId,
    revisionId, revision_id,
    verbose
  } =o;

  let {item_id} =o;

  const file = await db.query(`
    select *
    from cms.revisions_latest
    where item_id = $(item_id)
    ;
  `, {item_id}, {single:true})
  .then(retv =>{
    //console.log(`file:`,retv);
    return retv;
  });

  const {title,name,path,description,mimeType,latest_revision,live_revision} = file;

  return {
    kind: 'drive#file',
    id: item_id,
    etag: undefined,
    thumbnail: {
      image: undefined, //bytes...
      mimeType: undefined
    },
    title,
    name, path,
    mimeType,
    description,
    labels: {
      stared: false,
      hidden: false,
      trashed: false,
      restricted: false,
      viewed: false,
      modified: false
    },
    createdDate: undefined,
    modifiedDated: undefined,
    version: latest_revision,
    downloadUrl: undefined,
    indexableText: {
      text: undefined,
    },
    userPermission: undefined
  }
}

// --------------------------------------------------------------------------

async function list_revisions(o) {
  o = o||{};
  const {
    fileId, maxResults, pageToken, // google-drive
    // openacs
    verbose
  } =o;

  let {item_id} =o; // openacs fileId.
  item_id = item_id || fileId;

  const revisions = await db.query(`
    select *
    from cr_revisions
    where item_id = $(item_id)
    ;
  `, {item_id}, {single:false})
  .then(retv =>{
//    console.log('retv:',retv)
    return retv;
  });

  const a_revision = {
    kind: 'drive#revision',
    etag: undefined,
    id: undefined,
    selfLink: undefined,
    mimeType: undefined,
    modifiedDate: undefined,
    pinned: undefined,
    published: undefined,
    publishedLink: undefined,
    publishAuto: undefined,
    publishedOutsideDomain: undefined,
    downloadUrl: undefined,
    exportLinks: undefined,
    lastModifyingUser: {
      kind: 'drive#user',
      displayName: undefined, // screenName
      picture: {url:undefined},
      isAuthenticatedUser: false,
      permissionId: undefined,
      emailAddress: undefined
    },
    originalFileName: undefined,
    md5Checksum: undefined,
    fileSize: undefined
  };


  return {
    kind: "drive#revisionList",
    etag: undefined,
    selfLink: undefined,
    nextPageToken: undefined,
    items: revisions.map(revision =>{
      const revision2 = Object.assign({},a_revision,revision);
      console.log('revision2:',revision2)
      return revision2;
    })
  }
}

// --------------------------------------------------------------------------

async function create_folder(o) {
  o = o||{};
  const {
    ignoreDefaultVisibility,
    keepRevisionForever,
    ocrLanguage,
    useContentAsIndexableText,
    fields // to be included in a partial response.
  } =o;
  const { // request-body
    mimeType= 'application/vnd.google-apps.folder',
  } =o;
  const {
    parent_id,
    label, name,
    verbose,
    package_id,
    context_id,
    description
  } =o;

  _assert(parent_id, o, 'Missing parent_id')
  if (!parent_id) throw 'Missing parent_id';
  if (!name) throw 'Missing name';

  const retv = await db.query(`
    -- drive.files.create_folder
    select content_folder__new($(name),$(label),$(description),$(parent_id),$(package_id)) as folder_id;
    `,{
      parent_id,
      package_id,
      label: label||name,
      name,
      description: name
    },{single:true})
  .then(retv =>{
    console.log(`> content_folder__new =>`,retv)
    return retv;
  });


  /********************************************
    Catalogs are direct children in app_folder
  *********************************************/
  /*
  for (let cat of catalogs) {
    const {item_id, revision_id, name, path:ipath, h1, data, object_type, title} = cat;
    console.log(`[${item_id}:${revision_id}:${name}] ${object_type} @(${ipath}) "${title}"`)
  }*/


  return {
    kind: 'drive#fileList',
    folder_id: retv.folder_id
  }
}

// ---------------------------------------------------------------------------

async function create_file(o) {
  o = o||{};
  const {
    parent_id, name,
    title, description, text, // revision
    package_id,
    context_id,
    verbose
  } =o;

  const {
    ignoreDefaultVisibility,
    keepRevisionForever,
    ocrLanguage,
    useContentAsIndexableText,
    fields // to be included in a partial response.
  } =o;
  const { // request-body
    mimeType= 'application/vnd.google-apps.folder',
  } =o;

  _assert(parent_id, o, 'Missing parent_id')
  if (!name) throw 'Missing name';

  const retv = await db.query(`
    -- drive.files.create
    select content_item__new($(name),$(parent_id),$(title),$(description),$(text),$(package_id)) as item_id;
    `,{
      parent_id,
      package_id,
      title: title||name,
      name,
      description,
      text
    },{single:true})
  .then(retv =>{
    console.log(`> content_item__new =>`,retv)
    return retv;
  });


  /********************************************
    Catalogs are direct children in app_folder
  *********************************************/
  /*
  for (let cat of catalogs) {
    const {item_id, revision_id, name, path:ipath, h1, data, object_type, title} = cat;
    console.log(`[${item_id}:${revision_id}:${name}] ${object_type} @(${ipath}) "${title}"`)
  }*/


  return {
    kind: 'drive#fileList',
    folder_id: retv.folder_id
  }

}

// --------------------------------------------------------------------------


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

// --------------------------------------------------------------------------

async function drive(o) {
  o = o||{};
  const {verbose, password} = o;
  verbose &&
  console.log('function drive o:',o)
  Object.assign(conn__, {
    password,
    pg_monitor: (verbose>1)
  });
  db = await massive(conn__);
  if (!db) throw 'Unable to connect.'
  if (conn__.pg_monitor) {
    monitor.attach(db.driverConfig);
    console.log(`pg-monitor attached-Ok.`);
  }
  return {
    about: {
      get: function() {throw 'drive.about.get'},
    },
    drives: {
      create: function() {throw 'drive.drives.create'},
      delete: function() {throw 'drive.drives.delete'},
      get: get_drive_metadata,
      hide: function() {throw 'drive.drives.hide'},
      list: list_drives,
      unhide: function() {throw 'drive.drives.unhide'},
      update: function() {throw 'drive.drives.get'}
    },
    files: {
      get: get_file_metadata,
      create: create_file,
      create_folder: create_folder,
//      patch:
//      update:
//      copy:
//      delete:

      list: list_files,

//    touch:
//    trash:
//    untrash:
//     watch:
//      emptyTrash:
//      generateIds:
//     export:
    },
    revisions: {
      // delete
      // get
      list: list_revisions,
      // patch,
      // update
    }
  }
}


module.exports = {
  _assert,
  openacs_cms: {
    connect, disconnect
  },
  openacs: {
    drive,
    disconnect
  }
};
