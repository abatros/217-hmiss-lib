const {_assert} = require('./openacs-drive-api.js')



module.exports = (o) =>{
  const {
    object_type,
    pretty_name,
    pretty_plural,
    supertype = 'acs_object',
    table_name,
    id_column,
    package_name,
    abstract_p = false,
    type_extension_table,
    name_method
  } = o;

  _assert(object_type, o, 'Missing object_type')
  _assert(pretty_name, o, 'Missing pretty_name')
  _assert(supertype, o, 'Missing pretty_name')

  return db.query(`
    select acs_object_type__create_type(
      $(object_type),
      $(pretty_name),
      $(pretty_plural),
      $(supertype),
      $(table_name),
      $(id_column),
      $(package_name),
      $(abstract_p),
      $(type_extension_table),
      $(name_method));
    `, {
      object_type,
      pretty_name,
      pretty_plural,
      supertype,
      table_name,
      id_column,
      package_name,
      abstract_p,
      type_extension_table,
      name_method
    }, {single:true})
    .catch(err =>{
      if (err.code != 23505) throw err;
      console.log(`# alert acs_object_type__create_type err:`,err.detail)
      return null;
    })
/*
    .then(retv =>{
      console.log('retv:',retv)
    })
    .catch(err =>{
  //      console.log(`catch err:`,err)
      console.log(`catch err.code:${err.code} =>`, err.detail)
    });
    */
}
