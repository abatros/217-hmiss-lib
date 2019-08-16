const {_assert} = require('./openacs-drive-api.js')



module.exports = acs_user__delete;

async function acs_user__delete(o) {
  const {user_id, verbose} = o;
  _assert(user_id, o, "Missing user_id")
  _assert(Number.isInteger(user_id), o, "Missing user_id@10")
  return db.query(`
    select acs_user__delete($(user_id)::integer)
  `, {user_id}, {single:true});
}
