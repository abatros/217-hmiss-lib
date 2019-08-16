const {_assert} = require('./openacs-drive-api.js')

/*
acs_rel_roles... for what.
"admin";"#acs-kernel.Administrator#";"#acs-kernel.Administrators#"
"category";"Category";"Categories"
"component";"Component";"Components"
"composite";"Composite";"Composites"
"course_admin";"#dotlrn.course_admin_role_pretty_name#";"#dotlrn.course_admin_role_pretty_plural#"
"course_assistant";"#dotlrn.course_assistant_role_pretty_name#";"#dotlrn.course_assistant_role_pretty_plural#"
"email_image";"Email Image";"Email Images"
"instructor";"#dotlrn.instructor_role_pretty_name#";"#dotlrn.instructor_role_pretty_plural#"
"member";"#acs-kernel.member_role_pretty_name#";"#acs-kernel.member_role_pretty_plural#"
"meta_category";"Meta Category";"Meta Categories"
"party";"Party";"Parties"
"portrait";"Portrait";"Portraits"
"student";"#dotlrn.student_role_pretty_name#";"#dotlrn.student_role_pretty_plural#"
"teaching_assistant";"#dotlrn.teaching_assistant_role_pretty_name#";"#dotlrn.teaching_assistant_role_pretty_plural#"
"user";"User";"Users"
*/


module.exports = async (o) =>{
  const {
    // acs_rel_types
    rel_type,             // object_type
    object_type_one,      // object_type
    role_one,             // acs_rel_role
    min_n_rels_one =0,
    max_n_rels_one,
    object_type_two,
    role_two,
    min_n_rels_two =0,
    max_n_rels_two,
    composable_p = true,

    // acs_object_types
    pretty_name,
    pretty_plural,
    supertype,            // object_type
    table_name,
    id_column,
    package_name,
  } = o;

//  _assert()

  return await db.query(`
    select acs_rel_type__create_type(
      $(rel_type),
      $(pretty_name),
      $(pretty_plural),
      $(supertype),
      $(table_name),
      $(id_column),
      $(package_name),
      $(object_type_one),
      $(role_one),
      $(min_n_rels_one),
      $(max_n_rels_one),
      $(object_type_two),
      $(role_two),
      $(min_n_rels_two),
      $(max_n_rels_two),
      $(composable_p)) as rel_id;
  `, {
    rel_type,
    pretty_name,
    pretty_plural,
    supertype,
    table_name,
    id_column,
    package_name,
    object_type_one,
    role_one,
    min_n_rels_one,
    max_n_rels_one,
    object_type_two,
    role_two,
    min_n_rels_two,
    max_n_rels_two,
    composable_p
  }, {single:true})
  .catch(err =>{
    if (err.code != 23505) throw err;
    console.log(`# alert acs_object_type__create_type err:`,err.detail)
    return null;
  })

}
