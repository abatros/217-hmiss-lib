const {openacs_api:api, tapp, _assert} = require('../lib');

// repair-instance

module.exports = async (o) => {

  let {instance_name, name} = o;
  instance_name = instance_name || name;
  _assert(instance_name, o, "Missing name/instance_name")

  const package_id = await db.query(`
    select package_id from apm_packages
    join apm_applications on (application_id = package_id) -- to filter
    where (instance_name = $(instance_name));
  `,{instance_name}, {single:true})
  .then(retv =>{
    return retv.package_id
  })

  _assert(package_id, o, 'Unable to retrive package_id @49')
  console.log(`[repair-instance] package_id:${package_id}`)

  let app_folder = await db.query(`
    select content_folder__new(
      $(name),
      $(label),
      $(description),
      $(parent_id),
      $(context_id),
      $(folder_id),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(package_id)) as folder_id;
    `, {
      name: `tapp::${instance_name}`, // UNIQUE`cms-${package_id}`,
      label: `app-folder for tapp::${instance_name}`,
      description: 'app-folder for cms instance: '+instance_name,
      parent_id: -100,
      context_id: null,
      folder_id: null,
      creation_date: new Date(),
      creation_user: null,
      creation_ip: 'localhost',
      package_id,
    }, {single:true})
    .then(retv =>{
      console.log(`app_folder => retv:`,retv)
      return retv.folder_id;
    })
    .catch(async err =>{
      if (err.code != 23505) throw err;
      return null;
    });

  if (!app_folder) {
//    console.log(`alert@85 app_folder code:${err.code} => ${err.detail}`);
    app_folder = await db.query(`
      select folder_id
      from cr_folders
      join cr_items on (item_id = folder_id)
      where (parent_id = -100) and (name = $(name));
    `, {name}, {single:true})
    .then(retv =>{
      console.log({retv})
      return retv.folder_id
    })
    .catch(err =>{
      console.log(`error@99 : `,err)
    })
    _assert(app_folder, o, "Missing app_folder @97")
    return app_folder;

  }


  _assert(app_folder, o, "Missing app-folder @72")


  const clients_folder = await db.query(`
    select content_folder__new(
      $(name),
      $(label),
      $(description),
      $(parent_id),
      $(context_id),
      $(folder_id),
      $(creation_date),
      $(creation_user),
      $(creation_ip),
      $(package_id)) as folder_id;
    `, {
      name: `clients-folder`,
      label: `clients-folder for cms-${package_id}`,
      description: 'clients-folder for cms instance: '+instance_name,
      parent_id: app_folder,
      context_id: null,
      folder_id: null,
      creation_date: new Date(),
      creation_user: null,
      creation_ip: 'localhost',
      package_id,
    }, {single:true})
  .then(retv =>{
    console.log(`clients_folder => retv:`,retv)
    return retv.folder_id;
  })
  .catch(err =>{
    if (err.code != 23505) throw err;
    console.log(`error@163 code:${err.code} => ${err.detail}`);
  });



} // happ_instance_new.
