const {openacs_api:api, tapp, _assert} = require('../lib');
const register_organization = require('./organization.js')

/*

      PURGE ALL PROGRAMS WITHIN AN APP_INSTANCE

*/

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');

  const programs = await db.query(`
    select f.*, i.*, o.object_type
    from cr_folders f, cr_items i, acs_objects o
    where (item_id = folder_id)
    and (object_id = folder_id)
    and ((object_type = 'tapp-program') or (object_type = 'hmis-program'))
    and (o.package_id = $(package_id));
  `, {package_id}, {single:false})
  .then(programs =>{
    console.log({programs})
  })


}
