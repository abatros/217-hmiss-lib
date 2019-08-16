const {_assert} = require('./openacs-drive-api.js')

/*

  Automatically add to registered_users
  and give permission 'read/write' on the objects it owns:

    grant_permission (context:user_id, grantee:user_id, privilege:'read/write')

*/

module.exports = async (o) =>{
  const {
    user_id,
    object_type = 'user',
    creation_date = new Date(),
    creation_user,
    creation_ip = 'localhost' ,
    authority_id,
    username,
    email,
    url,
    first_names,
    last_name,
    password,
    salt,
    screen_name,
    email_verified_p,
    member_state,
    verbose
  } = o;

  _assert(username, o, 'Missing first_names')
//  _assert(screen_name, o, 'Missing first_names')
  _assert(first_names, o, 'Missing first_names')
  _assert(last_name, o, 'Missing last_name')
//  _assert(screen_name, o, 'Missing screen_name')


  const _user_id = db.query(`
    -- 16
    select acs__add_user(
        $(_user_id)::integer,
        $(object_type)::varchar,
        $(creation_date),
        $(creation_user)::integer,
        $(creation_ip)::varchar,
        $(authority_id)::integer,
        $(username)::varchar,
        $(email)::varchar,
        $(url)::varchar,
        $(first_names)::varchar,
        $(last_name)::varchar,
        $(password)::varchar,
        $(salt)::varchar,
        $(screen_name)::varchar,
        $(email_verified_p)::boolean,
        $(member_state)::varchar) as user_id;
  `,{
    _user_id:null,
    object_type,
    creation_date,
    creation_user,
    creation_ip,
    authority_id,
    username,
    email,
    url,
    first_names,
    last_name,
    password,
    salt,
    screen_name,
    email_verified_p,
    member_state
  },{single:true})
  .then(retv =>{
    verbose &&
    console.log(`user => retv:`,retv)
    return retv.user_id;
  })
  .catch(err =>{
    if (verbose) {
      console.log(`error code:${err.code} => ${err.detail}`);
      if (!err.detail) console.log(err)
    }
    throw err;
  });

  return _user_id;
}
