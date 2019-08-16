const {_assert} = require('./openacs-drive-api.js')


module.exports = content_item__get_content_type;

async function content_item__get_content_type(object_id) {
  return db.query(`
    select content_item__get_content_type($(object_id)) as content_type;
  `, {object_id}, {single:true})
  .then(retv => (retv.content_type))
}
