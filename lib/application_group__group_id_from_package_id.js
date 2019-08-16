const {_assert} = require('./openacs-drive-api.js')

module.exports = application_group__group_id_from_package_id;

function application_group__group_id_from_package_id(o) {
  const {package_id, no_complain =false} = o;
  _assert(package_id, o, "Missing packge_id");
  //_assert(no_complain, o, "Missing no_complain");
  return db.query(`
    select application_group__group_id_from_package_id(
      $(package_id), $(no_complain)
    ) as group_id;
  `,{package_id, no_complain}, {single:true})
  .then(retv =>{
    return retv && retv.group_id;
  })
}
