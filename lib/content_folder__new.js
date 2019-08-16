const {_assert} = require('./openacs-drive-api.js')

/*
CREATE OR REPLACE FUNCTION public.content_folder__new( ::11
    new__name character varying,
    new__label character varying,
    new__description character varying,
    new__parent_id integer,
    new__context_id integer,
    new__folder_id integer,
    new__creation_date timestamp with time zone,
    new__creation_user integer,
    new__creation_ip character varying,
    new__security_inherit_p boolean,
    new__package_id integer)
  RETURNS integer AS
*/

module.exports = async (o) =>{ // 11 parameters
  const {
    name,
    label,
    description,
    parent_id,
    context_id,
    creation_date = new Date(),
    creation_user,
    creation_ip = '127.0.0.1',
    security_inherit_p = true,
    package_id,
    verbose, object_type, content_type // :dkz
  } = o;

  _assert(parent_id, o, 'Missing parent_id');
  _assert(name, o, 'Missing name');

  _assert(label, o, 'Missing label');
  _assert(package_id, o, 'Missing package_id');


  return db.query(`
    select content_folder__new(
      $(name),
      $(label),
      $(description),
      $(parent_id),
      $(context_id),
      $(_folder_id),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(security_inherit_p),
      $(package_id)) as folder_id;
    `,{
      name,
      label,
      description,
      parent_id,
      context_id,
      _folder_id:null,
      creation_date,
      creation_user,
      creation_ip,
      security_inherit_p,
      package_id
    }, {single:true})
  .then(async retv =>{
    // console.log(`> content_folder__new =>`,retv)
    const {folder_id} = retv;
    if (object_type) {
      await db.query(`
        update acs_objects
        set object_type = $(object_type)
        where object_id = $(folder_id);
      `, {object_type,folder_id})
    }
    if (content_type) {
      await db.query(`
        update cr_items
        set content_type = $(content_type)
        where item_id = $(folder_id);
      `, {content_type,folder_id})
    }
    return folder_id;
  })
  .catch(err =>{
    if (err.code != 23505) throw err;
    verbose && console.log(`content_folder__new@88 warning code:${err.code} => ${err.detail}`);
  });
}
