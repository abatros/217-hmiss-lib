const {_assert} = require('./openacs-drive-api.js')



module.exports = content_folder__get;

async function content_folder__get(o) {
  const {
    folder_id,
    parent_id, name,
    package_id, // ? 2xcheck ?
    verbose
  } = o;

  if (folder_id) {
    return db.query(`
      select folder_id, label,
        parent_id, name,
        object_id, object_type, title, context_id, o.package_id
      from cr_folders
      join cr_items on (item_id = folder_id)
      join acs_objects o on (object_id = folder_id)
      where (folder_id = $(folder_id))
    `,{folder_id},{single:true});
  }


  _assert(parent_id, o, 'Missing parent_id');
  _assert(name, o, 'Missing name');

  const folder = await db.query(`
    select folder_id, label,
      parent_id, name,
      object_id, object_type, title, context_id, o.package_id
    from cr_folders
    join cr_items on (item_id = folder_id)
    join acs_objects o on (object_id = folder_id)
    where (parent_id = $(parent_id))
    and (name = $(name));
    `,{
      name,
      parent_id
    }, {single:true})
  .then(retv =>{
    return retv;
  })
  .catch(err =>{
    if (verbose) {
      console.log(`content_folder__get =>error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
    }
    throw err;
  });

  return folder;
}
