const {_assert} = require('./openacs-drive-api.js')

module.exports = content_item__get; // return {item}

//async
function content_item__get(o) {
  const {
    item_id,
    parent_id, name,
    package_id, // ? 2xcheck ?
    verbose
  } = o;


  if (item_id) {
    return db.query(`
      select
        parent_id, name, item_id,
        object_id, object_type, title, context_id, o.package_id
      from cr_items
      join acs_objects o on (object_id = item_id)
      where (item_id = $(item_id))
      `,{item_id}, {single:true})
  }



  _assert(parent_id, o, 'Missing parent_id');
  _assert(name, o, 'Missing name');


  return db.query(`
    select
      parent_id, name, item_id,
      object_id, object_type, title, context_id, o.package_id
    from cr_items
    join acs_objects o on (object_id = item_id)
    where (parent_id = $(parent_id))
    and (name = $(name));
    `,{
      name,
      parent_id
    }, {single:true})

    /*********************************************

  const item = await db.query(`
    select
      parent_id, name,
      object_id, object_type, title, context_id, o.package_id
    from cr_items on (item_id = folder_id)
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
      console.log(`content_item__get =>error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
      return {}
    }
    throw err;
  });

  return item;
  ***********************************/
}
