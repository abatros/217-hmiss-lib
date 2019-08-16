const {_assert} = require('./openacs-drive-api.js')

module.exports = async (group_id) =>{
  await db.query(`delete from groups where group_id = $(group_id)`,{group_id},{single:true});
  await db.query(`delete from parties where party_id = $(group_id)`,{group_id},{single:true});
  await db.query(`delete from acs_objects where object_id = $(group_id)`,{group_id},{single:true});
}
