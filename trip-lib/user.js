const {openacs_api:api, tapp, _assert} = require('../lib');
const register_organization = require('./organization.js')

module.exports = async (o)=>{
  const {first_names, last_name, email, screen_name, app_instance, verbose} = o;
  const {admin: admin_rels} = o;

  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');


  let user_id = await api.acs__add_user({
      first_names,
      last_name,
      screen_name: email,
      username: email
  })
  .catch(err =>{
    if (err.code == 23505) {
      console.log(`#USER alert:`,err.detail)
      return null;
    }
    throw err;
  })

  // FIRST TRY: on email
  if (!user_id) {
    await db.query(`
      select * from acs_users_all
      where (email = $(email));
    `,{email},{single:true})
    .then(retv =>{
      //console.log({retv})
      if (!retv) {
        console.log(`#USER alert: email <${email}> not found in users. trying username.`)
      } else {
        user_id = retv.user_id;
      }
    })
  }

  // SECOND TRY: on username (:=email)
  if (!user_id) {
    await db.query(`
      select * from acs_users_all
      where (username = $(email));
    `,{email},{single:true})
    .then(async retv =>{
      console.log({retv})
      if (retv) {
        const {user_id:_user_id, email:_email} = retv;
        user_id = _user_id;
        if (!_email) {
          await db.query(`
            update parties set email = $(email)
            where (party_id = $(user_id));
          `,{user_id,email},{single:true})
          .catch(async err =>{
            if (err.code != 23505) throw err;
            await db.query(`
              select * from parties
              where (email = $(email));
            `,{email},{single:true})
            .then(async party =>{
              console.log({party})
              const msg = `conflict between party:${party.party_id} email <${email}> and user:${user_id}`
              console.log(`${msg} --  removing party:${party.party_id}` )
              //await db.query(`select party__delete($(party_id));`,{party_id:party.party_id},{single:true});
              await api.group__delete(party.party_id);
              //await tapp.party__delete(party.party_id);
              console.log('#USER stop@59'); process.exit(-1)
            })
          }) // catch
        }
      }
    })
  } // SECOND TRY

  if (admin_rels) {
    _assert(Array.isArray(admin_rels), admin_rels, "Not an array");
    console.log(`#USER : found ${admin_rels.length} admin-relation${(admin_rels.length>1)?'s':''}.`)
    for (const it of admin_rels) {
//      console.log(`@85:`,{it});
      const {org:title} = it;
      Object.assign(it,{app_instance},{title}) // !!
      const org = await register_organization(it);
//      console.log(`@89:`,{org});
      _assert(org.folder_id, org, 'Missing folder_id@90')
      const rel_id = await api.acs_rel__new({
        rel_type: 'hmis-org-admin-rel',
        object_id_one: org.folder_id,
        object_id_two: user_id,
        context_id: app_folder, // security-context - who can modify this relation ?
        creation_user: null,
        creation_ip: '127.0.0.1',
        package_id // extension.
      })
      .catch(err =>{
        console.log(`org1@98:`,{org})
        throw err;
      })
      console.log(`#USER established relation (folder:${org.folder_id})-(user:${user_id}) =>`,{rel_id})
    }
  } // organizations


}
