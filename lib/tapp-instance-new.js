const {_assert} = require('./openacs-drive-api.js')
const application_group__new = require('./application_group__new.js')

exports.instance_new = async function(o) {

  let {instance_name, name} = o;
  instance_name = instance_name || name;
  _assert(instance_name, o, "Missing name/instance_name")

  /*
      IMPOSSIBLE to have unique composite key...

      The only way is to check on app.instance_name === app_folder.label
  */

  const app_instance = {
    application_id: null,
    instance_name,
    package_key: 'cms',
    object_type: 'apm_application',
    creation_date: new Date(),
    creation_user: null,
    creation_ip: 'localhost',
    context_id: null
  }

  await db.withTransaction(async tx =>{
    const package_id = await tx.query(`
      select apm_application__new(
        $(application_id),
        $(instance_name),
        $(package_key),
        $(object_type),
        $(creation_date),
        $(creation_user),
        $(creation_ip),
        $(context_id)) as package_id;
      `, app_instance, {single:true})
    .then(retv =>{
      console.log(`application_new => retv:`,retv)
      return retv.package_id;
    })
    .catch(async err =>{
      if (err.code != 23505) throw err;
      console.log(`error@45 code:${err.code} => ${err.detail}`);
      const package_id = await tx.query(`
        select package_id from apm_applications
        where (instance_name = $(instance_name));
      `,{instance_name}, {single:true})
      .then(retv =>{
        return retv.package_id
      })
      _assert(package_id, o, 'Unable to retrive package_id @49')
    });

    const app_folder = await tx.query(`
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
        console.log(`error@85 code:${err.code} => ${err.detail}`);
        console.log(`we should display latest acs_objects inserted...`)
        const app_folder = await tx.query(`
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

      });

    _assert(app_folder, o, "Missing app_folder @97")

    const org_folder = await tx.query(`
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
        name: `organizations-folder`,
        label: `organizations-folder for cms-${package_id}`,
        description: 'organizations-folder for cms instance: '+instance_name,
        parent_id: app_folder,
        context_id: null,
        folder_id: null,
        creation_date: new Date(),
        creation_user: null,
        creation_ip: 'localhost',
        package_id,
      }, {single:true})
      .then(retv =>{
        console.log(`organization_folder => retv:`,retv)
        return retv.folder_id;
      })
      .catch(err =>{
        if (err.code != 23505) throw err;
        console.log(`error@130 code:${err.code} => ${err.detail}`);
        if (!err.detail) console.log(err)
      });

    const clients_folder = await tx.query(`
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
        console.log(`error@163 code:${err.code} => ${err.detail}`);
        if (!err.detail) console.log(err)
    });

    const group_id = await application_group__new({
      db:tx,
      group_name: `group::${instance_name}`,
      group_type: 'tapp-community',
      context_id: package_id,
      package_id
    });

  })
  .then(retv =>{
    console.log(`transaction => retv:`,retv)
  })
  .catch(err =>{
    console.log(`transaction => err:`,err)
  });

} // happ_instance_new.
