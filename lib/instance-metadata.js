const {_assert} = require('./openacs-drive-api.js')

exports.instance_metadata = async function(o) {
  const {instance_name, verbose} = o;

  _assert(instance_name, o, 'Missing instance-name')

  /*
      A tapp instance folder is always directly under (-100)
  */

  const metadata = await db.query(`
    -- tapp instance metadata
    select
      folder_id,
      f.package_id,
      i.name
    from cr_folders f
    join cr_items i on (i.item_id = f.folder_id)
    join apm_packages p on (p.instance_name = $(instance_name))
    -- join acs_objects o on (o.object_id = f.folder_id)
    where (i.name = $(instance_name)) and (parent_id = -100)
    `, {instance_name}, {single:true})
    /*
  .then(app_instance =>{
    verbose &&
    console.log(`app_instance:`,app_instance);
    return app_instance
  }) */
  .catch(err =>{
    console.log(`error code:${err.code} => ${err.detail}`);
    if (!err.detail) console.log(err)
    throw 'FATAL@32'
  });

  const {package_id, folder_id:app_folder, name} = metadata;

  const folders = await db.query(`
    -- list folders under app_folder
    select
      folder_id,
      package_id,
      label, name, description
    from cr_folders f
    join cr_items i on (i.item_id = f.folder_id)
    where (i.parent_id = ${app_folder})
    `, {app_folder}, {single:false})
  .then(folders =>{
    verbose &&
    console.log(`folders:`,folders);
    return folders
  })
  .catch(err =>{
    console.log(`error code:${err.code} => ${err.detail}`);
    if (!err.detail) console.log(err)
    throw 'FATAL'
  });


  folders.forEach(folder =>{
    switch (folder.name) { // UNIQUE
      case 'clients-folder':
        metadata.clients = folder;
      break;
      case 'organizations-folder':
        metadata.organizations = folder;
      break;
      default:
        console.log(`[instance-metadata] ALERT unexpected top-folder <${folder.name}> `,folder)
    }
  })


  const groups = await db.query(`
    select
      group_name, object_type,
      email, url,
      context_id, ag.package_id, title
    from application_groups ag
    join groups g on (g.group_id = ag.group_id)
    join parties p on (p.party_id = ag.group_id)
    join acs_objects o on (o.object_id = ag.group_id)
    where (o.context_id = $(package_id));
    `, {package_id}, {single:false})
  .then(groups =>{
    verbose &&
    console.log(`groups:`,groups);
    return groups
  })
  .catch(err =>{
    console.log(`error code:${err.code} => ${err.detail}`);
    if (!err.detail) console.log(err)
    throw 'FATAL'
  });


  return Object.assign(metadata, {groups});
}
