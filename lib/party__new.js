Object.assign(org1, {
  party_id: null,
  object_type: 'hmis-organization',
  creation_date: new Date(),
  creation_user: null,
  creation_ip: 'localhost',
  email: email || contact.email,
  url: null,
  context_id: org_folder
});

const party_id = await db.query(`
  select party__new(
    $(party_id),
    $(object_type),
    $(creation_date),
    $(creation_user),
    $(creation_ip),
    $(email),
    $(url),
    $(context_id)) as party_id;
`,{
  party_id,
  object_type,
  creation_date,
  creation_user,
  creation_ip,
  email,
  url,
  context_id
},{single:true})
.then(retv =>{
  console.log(`party => retv:`,retv)
  return retv.pary_id;
})
.catch(err =>{
  console.log(`error code:${err.code} => ${err.detail}`);
  if (!err.detail) console.log(err)
  throw 'FATAL'
});
