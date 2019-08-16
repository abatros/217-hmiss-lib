const {_assert} = require('./openacs-drive-api.js')

/*
content_folder__register_content_type(
    register_content_type__folder_id integer,
    register_content_type__content_type character varying,
    register_content_type__include_subtypes boolean)
  RETURNS integer AS
*/

module.exports = content_folder__register_content_type;

function content_folder__register_content_type(o) {
  const {folder_id, content_type, include_subtypes} = o;
  _assert(folder_id, o, "Missing folder_id")
  _assert(content_type, o, "Missing content_type")
  return db.query(`
    select content_folder__register_content_type(
      $(folder_id), $(content_type), $(include_subtypes)
    );
  `,{folder_id, content_type, include_subtypes},{single:true});
}
