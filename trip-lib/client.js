const {openacs_api:api, tapp, _assert, xnor1} = require('../lib');
const register_organization = require('./organization.js')

module.exports = async (o)=>{
///  const {admin: admin_rels} = o;
  const {app_instance, verbose} = o;
  _assert(app_instance, o, 'Missing app_instance');
  const {package_id, folder_id:app_folder, clients, organizations} =  app_instance;
  _assert(app_folder, o, 'Missing app_folder');
  _assert(package_id, o, 'Missing package_id');
  _assert(clients, o, 'Missing app_instance.clients');

  const {folder_id: clients_folder} = clients;
//  const {folder_id: organizations_folder} = organizations;

  /*****************************************************

    A client is defined only by a folder.
    Later, we will have an enrollment with (program)
    and possibly with service-provider.

    A client <1:1>  case (workflow).
    A client could be enrolled into multiple programs.
    A Case could refers to another Case, if we want.

  ******************************************************/

  //console.log(`client:`,{o})
  const {first_names, last_name, email, id, ssn} = o;
  _assert(id||ssn, o, '@30 Missing ssn/id for client.')
  const label = `${first_names} ${last_name}-${id||ssn}`;
  const name = xnor1(label);
  _assert(clients_folder, o, 'Missing clients_folder');

  let folder = await api.content_folder__new({
    parent_id: clients_folder,
    name,
    label,
    // not used content_type: 'tapp-organization',
    object_type: 'hmis-client-folder',
    package_id
  })
  .then(folder_id =>{
    console.log(`[client] new folder_id => `,folder_id)
    return {folder_id};
  })
  .catch(async err =>{
//    verbose && show_pg_error(err)
    if (err.code != 23505) throw err;
    console.log(`Organization-folder already exists -- `, err.detail)
    const folder = await api.content_folder__get({parent_id:clients_folder, name});
    if (!folder) throw 'fatal@30.'
    return folder;
  });

  const {folder_id:client_folder} = folder;

  _assert(client_folder, folder, 'Missing folder_id')

  if (false) {
    await api.content_revision__new({
      title: 'in-folder::infos-client(!)',
      description: 'test : can we add revisions to a folder...',
  //    publish_date,
      mime_type: 'text/plain',
      nls_language: 'french',
      text: `
        this document contains the basic data for the case.
        But maybe we would be better by having documents
        101-Client-Infos
        102-Income-Benefits
        103-Health
        104-Employment-Education
        105-Disabilities
        106-Current-Living-Situation
        107-Services-provided (that should be shared/owned by provider)
        108-Events (use event system instead)
        109-Assessments
        110-Continuum-of-Care.
        It does not seems a good idea to link to a Person....
        `,
      item_id: client_folder,
      verbose:1
    })
    .then(revision_id =>{
      console.log(`new-revision added =>${revision_id}`)
    })
  }

  /************************************************

    Let's have document 101-gen-infos

  *************************************************/

  let doc_101 = await api.content_item__new({
    parent_id: client_folder,
    name: '101-gen-infos',
//    locale,
//    creation_date = new Date(),
//    creation_user,
    context_id: client_folder,
//    creation_ip: '127.0.0.1',
    item_subtype: 'acs_object',
//    content_type, XXXXXXX client-file ?????????????????????
    title: '101-gen-infos',
    description: "bio for the client / protected",
    mime_type: 'text/plain',
    nls_language: 'us_EN',
    text: "never used",
    data: {id:12344}, // ATTENTION JSONB here
//    relation_tag,
//    is_live boolean = true,
//    storage_type = 'TEXT',
    package_id,
//    with_child_rels = true,
    verbose
  })

  if (!doc_101) {
    console.log(`it means already exists.`)
    await db.query(`
      select item_id from cr_items
      where (name = '101-gen-infos') and (parent_id = $(client_folder))
    `, {client_folder}, {single:true})
    .then(({item_id}) =>{
      doc_101 = item_id
    })
  }

  _assert(doc_101, '', "Missing doc_101")

  await api.content_revision__new({
    item_id: doc_101,
    title: `101-infos-client for: ${name}`,
    description: 'test : can we add revisions to a folder...',
//    publish_date,
    mime_type: 'text/plain',
    nls_language: 'french',
    text: `
      this document contains the basic data for the case.
      each doc can have own set of protections.
      PersonalID varchar(32)
      FirstName varchar(50)
      MiddleName varchar(50)
      LastName varchar(50)
      NameSuffix varchar(50)
      NameDataQuality enum
      SSN varchar(5)
      SSNDataQuality enum
      DOB date
      DOBDataQuality enum
      AmIndAKNative boolean
      Asian boolean
      BlackAfAmerican boolean
      NativeHIOtherPacific boolean
      White boolean
      RaceNone
      Ethnicity enum
      Gender enum
      VeteranStatus enum
      YearEnteredService integer
      YearSeparated integer
      WorldWarII enum-1.8
      KoreanWar enum-1.8
      VietnamWar enum-1.8
      DesertStorm enum-1.8
      AfghanistanOEF enum-1.8
      IraqOIF enum-1.8
      IraqOND enum-1.8
      OtherTheater enum-1.8
      MilitaryBranch enum-1.11
      DischargeStatus enum-1.12
      DateCreated timestamp
      DateUpdated timestamp
      UserID varchar(32)
      DateDeleted timestamp
      ExportID varchar(32)
      `,
    verbose:1
  })
  .then(revision_id =>{
    console.log(`new-revision added =>${revision_id}`)
  })

  /*
  .then(item_id =>{
    console.log(`new item =>${item_id}`)
    return item_id;
  })
  .catch(async err =>{
    if (err.code != 23505) throw err;
    console.log(`alert `, err.detail)
    return await db.query(`
      select item_id from cr_items
      where (name = '101-gen-infos' and (parent_id = $(client_folder))
    `, {client_folder}, {single:true})
    .then(async ({client_id}) =>{
      await api.content_revision__new({
        item_id: client_folder,
        title: '101-infos-client NOT in folder.',
        description: 'test : can we add revisions to a folder...',
    //    publish_date,
        mime_type: 'text/plain',
        nls_language: 'french',
        text: `
          this document contains the basic data for the case.
          each doc can have own set of protections.
          `,
        verbose:1
      })
      .then(revision_id =>{
        console.log(`new-revision added =>${revision_id}`)
      })

      return client_id;
    })
  })
  */

  let doc_102 = await api.content_item__new({
    parent_id: client_folder,
    name: '102-Income-Benefits',
//    locale,
//    creation_date = new Date(),
//    creation_user,
    context_id: client_folder,
//    creation_ip: '127.0.0.1',
    item_subtype: 'acs_object',
//    content_type, XXXXXXX client-file ?????????????????????
    title: 'file: 102-Income-Benefits',
    description: "bio for the client / protected",
    mime_type: 'text/plain',
    nls_language: 'us_EN',
    text: `
    IncomeBenefitsID varchar(32)
    EnrollmentID varchar(32)
    PersonalID varchar(32)
    InformationDate date
    IncomeFromAnySource money
    TotalMonthlyIncome money
    Earned integer
    EarnedAmount money
    Unemployment integer
    UnemploymentAmount money
    SSI integer
    SSIAmount money
    SSDI integer
    SSDIAmount money
    VADisabilityService integer
    VADisabilityServiceAmount money
    VADisabilityNonService integer
    VADisabilityNonServiceAmount money
    PrivateDisability integer
    PrivateDisabilityAmount money
    WorkersComp integer
    WorkersCompAmount money
    TANF integer
    TANFAmount money
    GA integer
    GAAmount money
    SocSecRetirement integer
    SocSecRetirementAmount money
    Pension integer
    PensionAmount money
    ChildSupport integer
    ChildSupportAmount money
    Alimony integer
    AlimonyAmount money
    OtherIncomeSource integer
    OtherIncomeAmount money
    OtherIncomeSourceIdentify varchar(50)
    BenefitsFromAnySource integer
    SNAP integer
    WIC integer
    TANFChildCare integer
    TANFTransportation integer
    OtherTANF integer
    OtherBenefitsSource integer
    OtherBenefitsSourceIdentify varchar(50)
    InsuranceFromAnySource integer
    Medicaid integer
    NoMedicaidReason integer
    Medicare integer
    NoMedicareReason integer
    SCHIP integer
    NoSCHIPReason integer
    VAMedicalServices integer
    NoVAMedReason integer
    EmployerProvided integer
    NoEmployerProvidedReason integer
    COBRA integer
    NoCOBRAReason integer
    PrivatePay integer
    NoPrivatePayReason integer
    StateHealthIns integer
    NoStateHealthInsReason integer
    IndianHealthServices integer
    NoIndianHealthServicesReason integer
    OtherInsurance integer
    OtherInsuranceIdentify varchar(50)
    HIVAIDSAssistance integer
    NoHIVAIDSAssistanceReason integer
    ADAP integer
    NoADAPReason integer
    ConnectionWithSOAR integer
    DataCollectionStage integer
    DateCreated timestamp
    DateUpdated timestamp
    UserID varchar(32)
    DateDeleted timestamp
    ExportID varchar(32)`,
    data: {id:12344}, // ATTENTION JSONB here
//    relation_tag,
//    is_live boolean = true,
//    storage_type = 'TEXT',
    package_id,
//    with_child_rels = true,
    verbose
  })


}
