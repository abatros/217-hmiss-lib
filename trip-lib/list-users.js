const {openacs_api:api, tapp, _assert} = require('../lib');
const register_organization = require('./organization.js');

/*

  LIST USERS having relation with anything in this APP_INSTANCE.
  each membership has (package_id == instance_id)

*/

module.exports = async (o)=>{
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');

  const memberships = await db.query(`
    select acs_rels.*,
    o1.object_type as type1, o1.title as title1,
    o2.object_type as type2, o2.title as title2,
    o.object_type, o.context_id, o.package_id
    from acs_rels
    join acs_objects o on (o.object_id = rel_id)
    join acs_objects o1 on (o1.object_id = object_id_one)
    join acs_objects o2 on (o2.object_id = object_id_two)
    where (o.package_id = $(package_id));
  `, {package_id}, {single:false})

  memberships.forEach(membership =>{
    if (verbose) {
      console.log({membership})
    } else {
      const {rel_id, rel_type, object_type, object_id_one, object_id_two, context_id, package_id,
        type1, title1, type2, title2
      } = membership;
      console.log(`-- ${package_id}:${rel_id}:${rel_type} (${type1}:${title1})x(${type2}:${title2})`)
    }
  })

}
