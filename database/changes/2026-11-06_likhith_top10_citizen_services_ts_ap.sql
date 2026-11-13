-- Why: the 10 most-asked citizen services in Telangana and Andhra Pradesh need full step-by-step guides
-- (/services/<slug> on the web portal, and the services app). Only "pan-card" existed, with 4 thin steps.
-- Rules followed: official routes only; a fee is written only where it is a published national rate,
-- otherwise the guide says where the exact amount is shown. last_verified_at stays NULL so staff verify each
-- guide in the admin before it shows "Verified on".
-- Upserts by slug: safe to re-run. The search_index trigger re-syncs these rows automatically.
-- Undo: delete from gov_services where slug in ('passport','integrated-certificate','income-certificate',
--   'residence-certificate','obc-ncl-certificate','ews-certificate','driving-licence','voter-id',
--   'aadhaar-address-update');  -- pan-card existed before; restore it from a backup if needed.

insert into gov_services (
  slug, name, category, description, who_needs_it, eligibility_text, required_documents, fee_text,
  process_steps, processing_time_text, authority_name, authority_level, state_codes, official_url, apply_url,
  assistance_available, status, published_at
) values

-- 1. PAN ------------------------------------------------------------------------------------------------
('pan-card',
 'PAN Card (New Form 49A / Correction)',
 'Identity & Certificates',
 'Permanent Account Number (PAN) is the 10-character ID the Income Tax Department gives every taxpayer. Apply for a new PAN with Form 49A, or fix your name, date of birth, photo or address with the "Changes or Correction in PAN data" form, through Protean (NSDL) or UTIITSL.',
 'Anyone who files an income tax return, opens a bank or demat account, buys property or a vehicle, or makes high-value transactions. Students often need it for bank accounts and scholarships.',
 'Any Indian citizen. Minors apply through a parent or guardian. A person may hold only ONE PAN; having two is penalised under Section 272B of the Income Tax Act, so use the correction form, never a second new application.',
 '[
   {"name":"Proof of identity (Aadhaar / Voter ID / Passport / Driving Licence)","mandatory":true,"spec":"Self-attested copy; Aadhaar is enough for paperless e-KYC"},
   {"name":"Proof of address (Aadhaar / bank statement / electricity bill)","mandatory":true,"spec":"Self-attested copy"},
   {"name":"Proof of date of birth (birth certificate / 10th certificate / Aadhaar)","mandatory":true,"spec":"Self-attested copy"},
   {"name":"Two recent colour passport photos","mandatory":false,"spec":"3.5 cm x 2.5 cm; only for the physical (paper) route"},
   {"name":"Copy of current PAN card","mandatory":false,"spec":"Only for corrections"}
 ]'::jsonb,
 '₹107 with an Indian address (physical card + e-PAN); ₹1,017 with a foreign address. Instant e-PAN using Aadhaar is free on the Income Tax e-filing portal.',
 '[
   {"step":1,"title":"Pick your route","portal":"official","description":"Have Aadhaar with a linked mobile and only need a new PAN? Use the free Instant e-PAN on the Income Tax e-filing portal. Need a physical card or a correction? Use Protean (NSDL) or UTIITSL."},
   {"step":2,"title":"Fill Form 49A or the correction form","portal":"official","description":"New PAN: Form 49A, category Individual. Correction: Changes or Correction in PAN data. Enter your name exactly as in Aadhaar."},
   {"step":3,"title":"Choose how to submit","portal":"official","description":"Paperless: e-KYC and e-Sign with Aadhaar OTP (no papers to post). Physical: print, sign and post the form with photos and documents."},
   {"step":4,"title":"Pay the fee and save the acknowledgment","portal":"official","description":"Pay by UPI, card or net banking. Save the acknowledgment slip and number; you need it to track the application."},
   {"step":5,"title":"Post documents (physical route only)","portal":"offline","description":"Send the signed acknowledgment with photos and self-attested copies to the Protean or UTIITSL address printed on it within 15 days."},
   {"step":6,"title":"Track and receive","portal":"official","description":"Track with the acknowledgment number. The e-PAN arrives by email; the physical card comes by post."}
 ]'::jsonb,
 'Instant e-PAN: usually within minutes. Protean / UTIITSL: e-PAN by email after processing, physical card by post in about 15 to 20 working days.',
 'Income Tax Department (through Protean eGov / UTIITSL)', 'central', '{ALL}',
 'https://www.incometax.gov.in',
 'https://onlineservices.proteantech.in/paam/endUserRegisterContact.html',
 true, 'published', now()),

-- 2. Passport -------------------------------------------------------------------------------------------
('passport',
 'Passport (Fresh / Tatkaal)',
 'Identity & Certificates',
 'Apply for a fresh passport or a re-issue on the Passport Seva portal, then visit a Passport Seva Kendra (PSK) or Post Office PSK for document checks and biometrics. Tatkaal is the faster route for a higher fee.',
 'Anyone travelling abroad for study, work or tourism. Also a strong proof of identity, address and date of birth.',
 'Indian citizens. Minors apply with parental consent. Tatkaal follows the same form but needs the extra documents listed for Tatkaal on the portal.',
 '[
   {"name":"Proof of present address (Aadhaar / electricity, water or phone bill / bank passbook / rent agreement)","mandatory":true,"spec":"Original + self-attested copy at the PSK"},
   {"name":"Proof of date of birth (birth certificate / 10th certificate / PAN / Aadhaar)","mandatory":true,"spec":"Original + self-attested copy"},
   {"name":"Old passport","mandatory":false,"spec":"Re-issue only (original + copy of first and last pages)"},
   {"name":"Extra documents for Tatkaal","mandatory":false,"spec":"As per the Tatkaal document list on passportindia.gov.in"},
   {"name":"Appointment receipt (ARN)","mandatory":true,"spec":"Printout or SMS"}
 ]'::jsonb,
 '36 pages: ₹1,500 (Normal), ₹3,500 (Tatkaal). 60 pages: ₹2,000 (Normal), ₹4,000 (Tatkaal). Minors below 15 (36 pages): ₹1,000 (Normal), ₹3,000 (Tatkaal). Paid online when booking.',
 '[
   {"step":1,"title":"Register on Passport Seva","portal":"official","description":"Create a login on the Passport Seva portal and choose the Regional Passport Office for your address (Hyderabad for Telangana; Visakhapatnam or Vijayawada for Andhra Pradesh)."},
   {"step":2,"title":"Fill the application","portal":"official","description":"Choose Fresh or Re-issue, then Normal or Tatkaal, and 36 or 60 pages. Names and date of birth must match your documents exactly."},
   {"step":3,"title":"Pay and book an appointment","portal":"official","description":"Pay online and pick a slot at a PSK or Post Office PSK. Save the ARN / appointment receipt."},
   {"step":4,"title":"Visit the PSK with originals","portal":"offline","description":"Carry originals and self-attested copies. Staff check documents, take your photo and fingerprints, and an officer approves the file."},
   {"step":5,"title":"Police verification","portal":"offline","description":"Police verify your address. For Normal applications this usually happens before the passport is printed; for Tatkaal it is usually done after issue."},
   {"step":6,"title":"Track and receive by Speed Post","portal":"official","description":"Track with your file number on the portal or the mPassport Seva app. The passport arrives by Speed Post."}
 ]'::jsonb,
 'Normal: usually 30 to 45 days, mostly depending on police verification. Tatkaal: usually dispatched within 1 to 3 working days of the PSK visit.',
 'Ministry of External Affairs (Passport Seva) · Regional Passport Offices', 'central', '{ALL}',
 'https://www.passportindia.gov.in',
 'https://www.passportindia.gov.in',
 true, 'published', now()),

-- 3. Integrated Certificate ---------------------------------------------------------------------------
('integrated-certificate',
 'Integrated Certificate (Caste, Nativity, Date of Birth)',
 'Identity & Certificates',
 'One certificate from the Tahsildar (MRO) that confirms your caste (community), nativity and date of birth. Apply at a MeeSeva centre in Telangana, or a MeeSeva centre / Grama-Ward Sachivalayam in Andhra Pradesh.',
 'SC, ST and BC candidates claiming reservation in state jobs (TSPSC, APPSC, police), state admissions (EAPCET, ICET, PGECET counselling) and scholarships (TS ePASS, AP Jnanabhumi).',
 'Residents of Telangana or Andhra Pradesh who belong to a community notified as SC, ST or BC by that state.',
 '[
   {"name":"Aadhaar card","mandatory":true,"spec":"Original + copy"},
   {"name":"Caste proof","mandatory":true,"spec":"A parent’s or sibling’s caste certificate, or school records (TC / study certificate) showing caste"},
   {"name":"Date of birth proof (birth certificate / SSC memo)","mandatory":true,"spec":"Copy"},
   {"name":"Address proof (ration card / electricity bill)","mandatory":true,"spec":"Copy"},
   {"name":"Passport photo","mandatory":true,"spec":"Recent colour photo"},
   {"name":"Application form with self-declaration","mandatory":true,"spec":"Given and filled at the MeeSeva counter"}
 ]'::jsonb,
 'Only the MeeSeva / Sachivalayam service charge; the exact amount is printed on your receipt.',
 '[
   {"step":1,"title":"Go to a MeeSeva centre or Sachivalayam","portal":"assisted","description":"Telangana: any MeeSeva centre. Andhra Pradesh: MeeSeva or your Grama/Ward Sachivalayam. Carry all originals."},
   {"step":2,"title":"Operator files the application","portal":"assisted","description":"Ask for the Integrated Certificate. The operator scans your documents, takes the fee and gives a receipt with the application number and expected date."},
   {"step":3,"title":"Revenue enquiry","portal":"offline","description":"The VRO / Revenue Inspector may check your details or visit. Keep your phone on; answer any call from the Tahsildar office."},
   {"step":4,"title":"Tahsildar approves","portal":"official","description":"The Tahsildar approves and digitally signs the certificate."},
   {"step":5,"title":"Collect or download","portal":"official","description":"Collect the printout from MeeSeva with your application number, or check the status on the MeeSeva portal. Verify your name, caste and DOB before using it."}
 ]'::jsonb,
 'Depends on the revenue enquiry. The MeeSeva receipt shows the expected (SLA) date.',
 'Tahsildar (Mandal Revenue Office), Revenue Department', 'state', '{TS,AP}',
 'https://ts.meeseva.telangana.gov.in',
 'https://ap.meeseva.gov.in',
 true, 'published', now()),

-- 4. Income Certificate ---------------------------------------------------------------------------------
('income-certificate',
 'Income Certificate (MeeSeva)',
 'Identity & Certificates',
 'A certificate from the Tahsildar stating your family’s annual income. Apply at MeeSeva (Telangana) or MeeSeva / Grama-Ward Sachivalayam (Andhra Pradesh).',
 'Students applying for fee reimbursement and scholarships (TS ePASS, AP Jnanabhumi, NSP), and families applying for welfare schemes or income-based concessions.',
 'Residents of Telangana or Andhra Pradesh. Most schemes need a certificate issued for the current financial year, so check the scheme’s rule before applying.',
 '[
   {"name":"Aadhaar card","mandatory":true,"spec":"Original + copy"},
   {"name":"Ration card (white / food security card if you have one)","mandatory":false,"spec":"Copy"},
   {"name":"Income proof","mandatory":true,"spec":"Salary certificate or Form 16 for employees; self-declaration of income for farmers, business or daily wage"},
   {"name":"Land records (pattadar passbook)","mandatory":false,"spec":"If you have agricultural income"},
   {"name":"Passport photo","mandatory":true,"spec":"Recent colour photo"}
 ]'::jsonb,
 'Only the MeeSeva / Sachivalayam service charge; the exact amount is printed on your receipt.',
 '[
   {"step":1,"title":"Go to a MeeSeva centre or Sachivalayam","portal":"assisted","description":"Carry Aadhaar, income proof and the other documents in originals."},
   {"step":2,"title":"Apply for the Income Certificate","portal":"assisted","description":"The operator enters the family members and income, scans documents and gives a receipt with the application number."},
   {"step":3,"title":"VRO / RI verification","portal":"offline","description":"Revenue staff verify the declared income. Declare honestly; a wrong declaration can cancel scholarships later."},
   {"step":4,"title":"Tahsildar approves","portal":"official","description":"The Tahsildar approves and digitally signs the certificate."},
   {"step":5,"title":"Collect or download","portal":"official","description":"Collect the printout from MeeSeva or check the status online with your application number."}
 ]'::jsonb,
 'Depends on revenue verification. The MeeSeva receipt shows the expected (SLA) date.',
 'Tahsildar (Mandal Revenue Office), Revenue Department', 'state', '{TS,AP}',
 'https://ts.meeseva.telangana.gov.in',
 'https://ap.meeseva.gov.in',
 true, 'published', now()),

-- 5. Residence Certificate ------------------------------------------------------------------------------
('residence-certificate',
 'Residence Certificate (MeeSeva)',
 'Identity & Certificates',
 'A certificate from the Tahsildar confirming that you live at your stated address in the mandal. Apply at MeeSeva (Telangana) or MeeSeva / Grama-Ward Sachivalayam (Andhra Pradesh).',
 'Applicants who need proof of residence for jobs, admissions, bank or gas connections, and state schemes.',
 'People residing in Telangana or Andhra Pradesh at the address they apply for.',
 '[
   {"name":"Aadhaar card","mandatory":true,"spec":"Original + copy"},
   {"name":"Address proof","mandatory":true,"spec":"Ration card, electricity / gas bill, property tax receipt or registered rent agreement"},
   {"name":"Passport photo","mandatory":true,"spec":"Recent colour photo"},
   {"name":"Self-declaration of residence","mandatory":true,"spec":"Filled at the MeeSeva counter"}
 ]'::jsonb,
 'Only the MeeSeva / Sachivalayam service charge; the exact amount is printed on your receipt.',
 '[
   {"step":1,"title":"Go to a MeeSeva centre or Sachivalayam","portal":"assisted","description":"Carry Aadhaar and address proof in originals."},
   {"step":2,"title":"Apply for the Residence Certificate","portal":"assisted","description":"The operator scans documents, takes the fee and gives a receipt with the application number."},
   {"step":3,"title":"Address verification","portal":"offline","description":"The VRO may visit or call to confirm you live at the address."},
   {"step":4,"title":"Tahsildar approves","portal":"official","description":"The Tahsildar approves and digitally signs the certificate."},
   {"step":5,"title":"Collect or download","portal":"official","description":"Collect it from MeeSeva or check the status online with your application number."}
 ]'::jsonb,
 'Depends on address verification. The MeeSeva receipt shows the expected (SLA) date.',
 'Tahsildar (Mandal Revenue Office), Revenue Department', 'state', '{TS,AP}',
 'https://ts.meeseva.telangana.gov.in',
 'https://ap.meeseva.gov.in',
 true, 'published', now()),

-- 6. OBC Non-Creamy Layer -------------------------------------------------------------------------------
('obc-ncl-certificate',
 'OBC Non-Creamy Layer (NCL) Certificate (Central format)',
 'Identity & Certificates',
 'A certificate in the Central Government format confirming that you belong to a community in the Central OBC list for your state and are not in the "creamy layer". This is different from the state BC certificate.',
 'OBC candidates claiming reservation in central jobs (UPSC, SSC, IBPS, RRB) and central admissions (JEE, NEET, CUET, central universities, IITs, NITs).',
 'Your community must be in the Central OBC list for Telangana or Andhra Pradesh (check the NCBC list). You are in the creamy layer, and NOT eligible, if your parents’ gross annual income from sources other than salary and agricultural land is ₹8 lakh or more for three years in a row, or if a parent holds certain senior posts (for example Group A / Class I officers or constitutional posts).',
 '[
   {"name":"Caste certificate (BC) / Integrated Certificate","mandatory":true,"spec":"Copy"},
   {"name":"Parents’ income proof for the last three years","mandatory":true,"spec":"Salary certificates / Form 16 / ITR, and income from other sources"},
   {"name":"Aadhaar card","mandatory":true,"spec":"Original + copy"},
   {"name":"Ration card / address proof","mandatory":true,"spec":"Copy"},
   {"name":"Passport photo","mandatory":true,"spec":"Recent colour photo"},
   {"name":"Self-declaration / affidavit","mandatory":true,"spec":"In the format the Tahsildar office asks for"}
 ]'::jsonb,
 'Only the MeeSeva / Sachivalayam service charge; the exact amount is printed on your receipt.',
 '[
   {"step":1,"title":"Check the notification first","portal":"official","description":"Read which format and issue date the exam asks for. Many need an NCL certificate issued in the current financial year or after a cut-off date."},
   {"step":2,"title":"Go to MeeSeva or Sachivalayam","portal":"assisted","description":"Ask clearly for the OBC Non-Creamy Layer certificate in the Central Government format, not the state BC certificate."},
   {"step":3,"title":"Submit income details","portal":"assisted","description":"The operator records both parents’ income for three years and scans your caste certificate and proofs."},
   {"step":4,"title":"Revenue verification","portal":"offline","description":"Revenue staff check the income and creamy-layer status."},
   {"step":5,"title":"Tahsildar issues the certificate","portal":"official","description":"Collect it from MeeSeva. Check that it says Non-Creamy Layer, names the Central list entry of your caste, and has the right date."}
 ]'::jsonb,
 'Depends on revenue verification. The MeeSeva receipt shows the expected (SLA) date. Apply well before the exam’s last date.',
 'Tahsildar (Mandal Revenue Office), Revenue Department', 'state', '{TS,AP}',
 'https://ts.meeseva.telangana.gov.in',
 'https://ap.meeseva.gov.in',
 true, 'published', now()),

-- 7. EWS ------------------------------------------------------------------------------------------------
('ews-certificate',
 'EWS Certificate (Central & State format)',
 'Identity & Certificates',
 'Certificate for the 10% Economically Weaker Sections reservation. The Central format ("Income and Asset Certificate") is for central jobs and admissions; the State format is for Telangana or Andhra Pradesh state jobs and admissions. Make sure you get the format your notification asks for.',
 'General-category candidates claiming EWS reservation in central exams (UPSC, SSC, banks, RRB, JEE, NEET) or state exams and admissions.',
 'Central format: you must not be covered by SC, ST or OBC reservation, and your family’s gross annual income from all sources must be below ₹8 lakh in the financial year before you apply. The family must NOT own: 5 acres or more of agricultural land; a flat of 1,000 sq ft or more; a residential plot of 100 sq yards or more in notified municipalities, or 200 sq yards or more elsewhere. State format: issued under the state’s own Government Order, whose conditions can differ; the Tahsildar office applies the current state rule.',
 '[
   {"name":"Aadhaar card","mandatory":true,"spec":"Original + copy"},
   {"name":"Family income proof for the previous financial year","mandatory":true,"spec":"Salary certificates / Form 16 / ITR / self-declaration for other income"},
   {"name":"Land and property details","mandatory":true,"spec":"Pattadar passbook, property tax receipts or a declaration that you own none"},
   {"name":"Ration card / address proof","mandatory":true,"spec":"Copy"},
   {"name":"Passport photo","mandatory":true,"spec":"Recent colour photo"},
   {"name":"Self-declaration","mandatory":true,"spec":"Filled at the counter"}
 ]'::jsonb,
 'Only the MeeSeva / Sachivalayam service charge; the exact amount is printed on your receipt.',
 '[
   {"step":1,"title":"Find the format you need","portal":"official","description":"Central job or admission: Central format (Income and Asset Certificate). TS/AP state job or admission: State format. Note the financial year the notification asks for."},
   {"step":2,"title":"Go to MeeSeva or Sachivalayam","portal":"assisted","description":"Ask for the EWS certificate in that format. Carry income and property documents."},
   {"step":3,"title":"Declare income and assets","portal":"assisted","description":"The operator records family income from all sources and land / house details, and scans the proofs."},
   {"step":4,"title":"Revenue verification","portal":"offline","description":"Revenue staff verify income and assets."},
   {"step":5,"title":"Tahsildar issues the certificate","portal":"official","description":"Collect it from MeeSeva. It is valid for the financial year it is issued for; get a new one for a new year’s notification."}
 ]'::jsonb,
 'Depends on revenue verification. The MeeSeva receipt shows the expected (SLA) date.',
 'Tahsildar (Mandal Revenue Office), Revenue Department', 'state', '{TS,AP}',
 'https://ts.meeseva.telangana.gov.in',
 'https://ap.meeseva.gov.in',
 true, 'published', now()),

-- 8. Driving Licence / LL -------------------------------------------------------------------------------
('driving-licence',
 'Driving Licence / Learner’s Licence (Parivahan Sarathi)',
 'Transport & Vehicles',
 'Get a Learner’s Licence (LL) first, then a permanent Driving Licence (DL) after a driving test, through the Parivahan Sarathi portal and your Regional Transport Authority (RTA).',
 'Anyone who wants to drive a motorcycle, car or other vehicle on public roads.',
 'LL: 16 years for gearless two-wheelers up to 50 cc (with parent consent); 18 years for motorcycles with gear and cars (LMV). You must hold the LL for at least 30 days before the DL test; the LL is valid for 6 months. Transport (commercial) licences have extra conditions.',
 '[
   {"name":"Aadhaar card","mandatory":true,"spec":"Enables e-KYC; some services need it"},
   {"name":"Age proof (birth certificate / 10th certificate / passport)","mandatory":true,"spec":"Upload on Sarathi"},
   {"name":"Address proof (Aadhaar / passport / utility bill)","mandatory":true,"spec":"Upload on Sarathi"},
   {"name":"Passport photo and signature","mandatory":true,"spec":"Uploaded in the size Sarathi asks"},
   {"name":"Form 1 (self-declaration of physical fitness)","mandatory":true,"spec":"Filled online"},
   {"name":"Form 1A medical certificate","mandatory":false,"spec":"If you are 40+ or applying for a transport licence"}
 ]'::jsonb,
 'Central Motor Vehicles Rules fees: Learner’s Licence ₹150 + LL test ₹50; driving test ₹300; DL issue ₹200. States may add smart-card and service charges; Sarathi shows the exact total before you pay.',
 '[
   {"step":1,"title":"Open Sarathi and choose your state","portal":"official","description":"Go to Parivahan Sarathi and select Telangana or Andhra Pradesh. If your state’s transport department uses its own page for a service, Sarathi links you there."},
   {"step":2,"title":"Apply for a Learner’s Licence","portal":"official","description":"Fill the LL form, pick vehicle classes (MCWG for geared bike, LMV for car), and upload documents, photo and signature."},
   {"step":3,"title":"Pay and book the LL test","portal":"official","description":"Pay the fee and book an LL test slot at the RTA office, or take the online Aadhaar-based test where your state offers it."},
   {"step":4,"title":"Pass the LL test","portal":"offline","description":"A short test on road signs and traffic rules. Download your LL from Sarathi after you pass."},
   {"step":5,"title":"Apply for the Driving Licence","portal":"official","description":"After 30 days and before the LL expires (6 months), apply for the DL on Sarathi and book a driving test slot."},
   {"step":6,"title":"Take the driving test at the RTA","portal":"offline","description":"Bring your LL, originals and a road-worthy vehicle of that class with L-board and valid papers."},
   {"step":7,"title":"Receive your DL","portal":"official","description":"The DL card comes by post. You can also show it from DigiLocker or mParivahan."}
 ]'::jsonb,
 'LL: same day once you pass the test. DL: test after 30 days of holding the LL; the card is usually posted within a few weeks of passing.',
 'Transport Department / Regional Transport Authority (RTA) · Parivahan Sarathi (MoRTH)', 'state', '{TS,AP}',
 'https://parivahan.gov.in',
 'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do',
 true, 'published', now()),

-- 9. Voter ID -------------------------------------------------------------------------------------------
('voter-id',
 'Voter ID Card (Form 6, ECI)',
 'Identity & Certificates',
 'Register as a new voter with Form 6 on the Election Commission of India’s Voters’ Service Portal or the Voter Helpline app. Use Form 8 to shift your address or correct details on an existing card.',
 'Every Indian citizen aged 18 or more who wants to vote. The EPIC card is also an accepted identity and address proof.',
 'Indian citizen, 18 years old on a qualifying date (1 January, 1 April, 1 July or 1 October of the year), and ordinarily resident at the address in the constituency. You can apply in advance from age 17.',
 '[
   {"name":"Passport-size photo","mandatory":true,"spec":"Recent, light background; uploaded online"},
   {"name":"Age proof (birth certificate / 10th certificate / Aadhaar / PAN / passport / DL)","mandatory":true,"spec":"Upload"},
   {"name":"Address proof (Aadhaar / utility bill / bank passbook / passport / rent agreement)","mandatory":true,"spec":"Upload"},
   {"name":"Aadhaar number","mandatory":false,"spec":"Optional in Form 6"},
   {"name":"EPIC number of a family member","mandatory":false,"spec":"Helps place you in the right polling part"}
 ]'::jsonb,
 'Free. No fee for registration or the EPIC card.',
 '[
   {"step":1,"title":"Sign up on the Voters’ Service Portal","portal":"official","description":"Open voters.eci.gov.in or the Voter Helpline app and sign up with your mobile number."},
   {"step":2,"title":"Open Form 6","portal":"official","description":"New voter: Form 6. Already registered and moving or correcting details: Form 8."},
   {"step":3,"title":"Fill details and upload proofs","portal":"official","description":"Enter details exactly as in your documents, upload photo, age and address proof, and submit. Save the reference number."},
   {"step":4,"title":"BLO verification","portal":"offline","description":"Your Booth Level Officer may visit to verify. Keep originals ready."},
   {"step":5,"title":"Track the status","portal":"official","description":"Track with the reference number. The Electoral Registration Officer accepts or rejects the form."},
   {"step":6,"title":"Download e-EPIC","portal":"official","description":"Once enrolled, download the e-EPIC from the portal. The PVC card is sent by post."}
 ]'::jsonb,
 'Depends on BLO verification and the electoral roll revision schedule. Track with your reference number.',
 'Election Commission of India · Chief Electoral Officer (Telangana / Andhra Pradesh)', 'central', '{ALL}',
 'https://voters.eci.gov.in',
 'https://voters.eci.gov.in',
 true, 'published', now()),

-- 10. Aadhaar address update ----------------------------------------------------------------------------
('aadhaar-address-update',
 'Aadhaar Address Update (myAadhaar)',
 'Identity & Certificates',
 'Update the address on your Aadhaar online on UIDAI’s myAadhaar portal with an address proof, or through the Head of Family route. Name, date of birth, photo and biometrics need a visit to an Aadhaar Seva Kendra or enrolment centre.',
 'Anyone who has moved house or whose Aadhaar address is wrong. Banks, scholarships, DigiLocker and most government forms read the Aadhaar address.',
 'Any Aadhaar holder whose mobile number is linked to Aadhaar (for the online route). Without a linked mobile, visit an Aadhaar Seva Kendra or enrolment centre.',
 '[
   {"name":"Proof of address in your own name","mandatory":true,"spec":"Passport, bank passbook / statement, recent electricity / water / gas bill, registered rent agreement, ration card or voter ID; JPEG, PNG or PDF up to 2 MB"},
   {"name":"Mobile number linked to Aadhaar","mandatory":true,"spec":"For the login OTP"},
   {"name":"Head of Family relationship proof","mandatory":false,"spec":"Only for the Head of Family route (e.g. ration card, marriage certificate, passport)"}
 ]'::jsonb,
 'UIDAI charges a small fee for an online address update; the current amount is shown before you pay. UIDAI sometimes runs free online document-update periods.',
 '[
   {"step":1,"title":"Log in to myAadhaar","portal":"official","description":"Open myaadhaar.uidai.gov.in, enter your Aadhaar number and the OTP sent to your linked mobile."},
   {"step":2,"title":"Choose Address Update","portal":"official","description":"Pick Update Aadhaar Online and select Address. Use the Head of Family option if the address proof is in a family member’s name."},
   {"step":3,"title":"Enter the new address","portal":"official","description":"Type the address exactly as it appears on your address proof, including house number and PIN code."},
   {"step":4,"title":"Upload the address proof","portal":"official","description":"Upload a clear scan (JPEG, PNG or PDF, max 2 MB). The name on it must match your Aadhaar."},
   {"step":5,"title":"Pay and save the SRN","portal":"official","description":"Pay the fee and save the Service Request Number (SRN / URN)."},
   {"step":6,"title":"Track and download e-Aadhaar","portal":"official","description":"Track with the URN on myAadhaar. Once updated, download the new e-Aadhaar; order a PVC card if you need one."}
 ]'::jsonb,
 'Track with your URN on myAadhaar; most address updates complete within a few weeks.',
 'Unique Identification Authority of India (UIDAI)', 'central', '{ALL}',
 'https://uidai.gov.in',
 'https://myaadhaar.uidai.gov.in',
 true, 'published', now())

on conflict (slug) do update set
  name                 = excluded.name,
  category             = excluded.category,
  description          = excluded.description,
  who_needs_it         = excluded.who_needs_it,
  eligibility_text     = excluded.eligibility_text,
  required_documents   = excluded.required_documents,
  fee_text             = excluded.fee_text,
  process_steps        = excluded.process_steps,
  processing_time_text = excluded.processing_time_text,
  authority_name       = excluded.authority_name,
  authority_level      = excluded.authority_level,
  state_codes          = excluded.state_codes,
  official_url         = excluded.official_url,
  apply_url            = excluded.apply_url,
  assistance_available = excluded.assistance_available,
  status               = excluded.status,
  published_at         = coalesce(gov_services.published_at, excluded.published_at),
  last_verified_at     = null,  -- content changed: staff re-verify in the admin
  updated_at           = now();
