const {_assert} = require('./openacs-drive-api.js')


/*
CREATE OR REPLACE FUNCTION public.content_item__new(
    new__name character varying,
    new__parent_id integer,
    new__item_id integer,
    new__locale character varying,
    new__creation_date timestamp with time zone,
    new__creation_user integer,
    new__context_id integer,
    new__creation_ip character varying,
    new__item_subtype character varying,
    new__content_type character varying,
    new__title character varying,
    new__description text,
    new__mime_type character varying,
    new__nls_language character varying,
    new__text character varying,
    new__data text,
    new__relation_tag character varying,
    new__is_live boolean,
    new__storage_type cr_item_storage_type_enum,
    new__package_id integer DEFAULT NULL::integer,
    new__with_child_rels boolean DEFAULT true)
  RETURNS integer AS
*/


module.exports = async (o) =>{ // 21 parameters
  const {
    name,
    parent_id,
    // item_id,
    locale,
    creation_date = new Date(),
    creation_user,
    context_id,
    creation_ip = '127.0.0.1',
    item_subtype,
    content_type = 'content_revision',
    title,
    description,
    mime_type = 'text/plain',
    nls_language = 'us_EN',
    text,
    data, // ATTENTION JSONB here
    relation_tag,
    is_live = true,
    storage_type = 'text',
    package_id,
    with_child_rels = true,
    verbose
  } = o;

  _assert(parent_id, o, "Missing parent_id")
  _assert(name, o, "Missing name")
//  _assert(content_type, o, "Missing content_type")
  _assert(item_subtype, o, "Missing item_subtype (tapp.contract!)")


  return db.query(`
    select content_item__new(
      $(name), -- name
      $(parent_id), -- parent_id
      $(_item_id), -- item_id
      $(locale),
      $(creation_date),
      $(creation_user),
      $(context_id), -- context_id
      $(creation_ip),
      $(item_subtype), -- item_subtype
      $(content_type), -- content_type
      $(title), -- title
      $(description), -- description
      $(mime_type),
      $(nls_language),
      $(text),
      $(_data),
      $(relation_tag), -- relation_tag
      $(is_live), -- is_live
      $(storage_type),
      $(package_id), -- package_id
      $(with_child_rels) -- with_child_rels
    ) as item_id;
    `, {
      name,
      parent_id,
      _item_id: null,
      locale,
      creation_date,
      creation_user,
      context_id,
      creation_ip,
      item_subtype,
      content_type,
      title,
      description,
      mime_type,
      nls_language,
      text,
      _data: null, // the real data goes into data:jsonb
      relation_tag,
      is_live,
      storage_type,
      package_id,
      with_child_rels
    }, {single:true})
  .then(({item_id}) =>{
    //verbose &&
    //console.log(`added new content_item =>${item_id}`)
    return item_id;
  })
  .catch(err =>{
    if (err.code != 23505) throw err;
    verbose && console.log(`content_item__new@117 alert new item =>`,err.detail)
  })
}
