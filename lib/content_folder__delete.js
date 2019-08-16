const {_assert} = require('./openacs-drive-api.js')

module.exports = async (o) =>{
  const {
    folder_id,
    cascade = false,
    verbose
  } = o;

  _assert(folder_id, o, 'Missing folder_id');

  return await db.query(`
    select content_folder__delete($(folder_id),$(cascade));
    `,{folder_id, cascade}, {single:true})
  .catch(err =>{
    if (verbose) {
      console.log(`content_folder__delete =>error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
    }
    throw err;
  });

}
