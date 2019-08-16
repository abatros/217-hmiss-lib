const {_assert} = require('./openacs-drive-api.js')

/*
CREATE OR REPLACE FUNCTION public.content_item__relate(
    item_id integer,
    object_id integer,
    relation_tag character varying,
    order_n integer,
    relation_type character varying)
  RETURNS integer AS
*/


module.exports = content_item__relate;

async function content_item__relate(o) {
  const {
    item_id,
    object_id,
    relation_tag,
    order_n,
    relation_type
  } = o;

  _assert(item_id, o, "Missing item_id")
  _assert(object_id, o, "Missing object_id")

  return db.query(`
    select content_item__relate(
      $(item_id),
      $(object_id),
      $(relation_tag),
      $(order_n),
      $(relation_type)) as rel_id;
    `, {
      item_id,
      object_id,
      relation_tag,
      order_n,
      relation_type
    }, {single:true})
    .then(retv => (retv.rel_id))
} // function.
