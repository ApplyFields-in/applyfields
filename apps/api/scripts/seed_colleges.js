import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.obvcvcgwzjzsujdczxyj:Applyfields%402026@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const payloadPath = 'C:\\Users\\Likhith Kumar\\.gemini\\antigravity-ide\\brain\\44aebbc2-17c6-4833-91b0-1fb679995b62\\scratch\\colleges_payload.json';

const ADDITIONAL_COURSES = [
  {
    id: 'c1000000-0000-0000-0000-000000000010',
    slug: 'btech-ece',
    name: 'Bachelor of Technology in Electronics & Communication Engineering',
    short_name: 'B.Tech ECE',
    level: 'ug',
    stream: 'Engineering & Technology',
    description: 'Undergraduate engineering program focused on electronic devices, circuits, signal processing, and communication networks.',
    eligibility_text: '10+2 with Physics, Mathematics, and Chemistry with minimum 50% marks.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['VLSI Design', 'Embedded Systems', 'Digital Signal Processing', 'IoT', 'Wireless Communications'],
    career_outcomes: 'Electronics Engineer, Embedded Systems Developer, Telecom Engineer, Hardware Architect',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000011',
    slug: 'btech-me',
    name: 'Bachelor of Technology in Mechanical Engineering',
    short_name: 'B.Tech ME',
    level: 'ug',
    stream: 'Engineering & Technology',
    description: 'Core engineering discipline covering mechanics, thermodynamics, fluid dynamics, CAD design, and advanced manufacturing.',
    eligibility_text: '10+2 with Physics, Chemistry, and Mathematics from a recognized board.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['CAD/CAM', 'Thermodynamics', 'Robotics & Automation', 'Finite Element Analysis', 'Manufacturing Systems'],
    career_outcomes: 'Mechanical Engineer, Design Analyst, Robotics Specialist, Manufacturing Manager',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000012',
    slug: 'btech-ce',
    name: 'Bachelor of Technology in Civil Engineering',
    short_name: 'B.Tech CE',
    level: 'ug',
    stream: 'Engineering & Technology',
    description: 'Engineering discipline dealing with structural design, construction, surveying, geotechnical analysis, and infrastructure management.',
    eligibility_text: '10+2 with Physics, Mathematics, and Chemistry.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['Structural Analysis', 'AutoCAD Civil 3D', 'Geotechnical Engineering', 'Project Management', 'Surveying'],
    career_outcomes: 'Civil Engineer, Structural Consultant, Urban Planning Specialist, Construction Project Manager',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000013',
    slug: 'btech-eee',
    name: 'Bachelor of Technology in Electrical & Electronics Engineering',
    short_name: 'B.Tech EEE',
    level: 'ug',
    stream: 'Engineering & Technology',
    description: 'Engineering branch encompassing electrical power generation, transmission, electrical machines, control systems, and power electronics.',
    eligibility_text: '10+2 with Mathematics and Physics.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['Power Systems', 'Control Systems', 'Renewable Energy', 'Power Electronics', 'Electrical Machines'],
    career_outcomes: 'Electrical Engineer, Power Grid Specialist, Control Systems Engineer, Renewable Energy Consultant',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000014',
    slug: 'btech-it',
    name: 'Bachelor of Technology in Information Technology',
    short_name: 'B.Tech IT',
    level: 'ug',
    stream: 'Engineering & Technology',
    description: 'Undergraduate course emphasizing software systems, network architecture, web development, cybersecurity, and cloud infrastructure.',
    eligibility_text: '10+2 with Physics and Mathematics.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['Software Engineering', 'Database Management', 'Cloud Computing', 'Cyber Security', 'Full-Stack Development'],
    career_outcomes: 'Software Engineer, Systems Architect, Cloud Operations Specialist, IT Consultant',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000015',
    slug: 'btech-chem',
    name: 'Bachelor of Technology in Chemical Engineering',
    short_name: 'B.Tech Chemical',
    level: 'ug',
    stream: 'Engineering & Technology',
    description: 'Discipline dealing with chemical process plants, material synthesis, petroleum refining, and environmental engineering.',
    eligibility_text: '10+2 with Chemistry, Physics, and Mathematics.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['Process Dynamics', 'Reaction Engineering', 'Thermodynamics', 'Biochemical Engineering', 'Process Safety'],
    career_outcomes: 'Chemical Process Engineer, Refinery Specialist, Safety Officer, Biochemical Researcher',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000016',
    slug: 'diploma-polytechnic',
    name: 'Diploma in Engineering & Technology (Polytechnic)',
    short_name: 'Polytechnic Diploma',
    level: 'diploma',
    stream: 'Engineering & Technology',
    description: 'Practical 3-year technical education diploma providing hands-on engineering competencies and lateral entry to B.Tech.',
    eligibility_text: 'Pass in 10th Class (SSC) with Mathematics and Science.',
    min_qualification: '10th',
    duration_months: 36,
    skills_developed: ['Technical Drawing', 'Workshop Practice', 'Circuit Testing', 'Machine Maintenance', 'Industrial Safety'],
    career_outcomes: 'Junior Engineer, Technical Supervisor, CAD Drafter, Plant Technician',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000017',
    slug: 'mba',
    name: 'Master of Business Administration',
    short_name: 'MBA',
    level: 'pg',
    stream: 'Management & Business',
    description: 'Postgraduate business management programme preparing leaders in Marketing, Finance, HR, Operations, and Business Analytics.',
    eligibility_text: 'Bachelor degree in any discipline with minimum 50% marks + CAT/MAT/State MBA CET.',
    min_qualification: 'graduate',
    duration_months: 24,
    skills_developed: ['Financial Analysis', 'Strategic Management', 'Marketing Strategy', 'Operations Management', 'Leadership'],
    career_outcomes: 'Management Consultant, Business Analyst, Product Manager, Investment Banker',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000018',
    slug: 'mca',
    name: 'Master of Computer Applications',
    short_name: 'MCA',
    level: 'pg',
    stream: 'Computer Applications',
    description: 'Postgraduate programme covering enterprise software engineering, database administration, and cloud-native architecture.',
    eligibility_text: 'BCA/B.Sc Computer Science or Bachelor degree with Mathematics in 10+2.',
    min_qualification: 'graduate',
    duration_months: 24,
    skills_developed: ['Enterprise Java/Python', 'Distributed Systems', 'Cloud Architecture', 'Database Design', 'Algorithm Optimization'],
    career_outcomes: 'Senior Software Engineer, Database Administrator, Systems Architect, Data Analyst',
    status: 'published'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000019',
    slug: 'bpharm',
    name: 'Bachelor of Pharmacy',
    short_name: 'B.Pharm',
    level: 'ug',
    stream: 'Pharmacy & Healthcare',
    description: 'Undergraduate pharmaceutical degree covering pharmacognosy, pharmaceutics, medicinal chemistry, and drug formulations.',
    eligibility_text: '10+2 with Physics, Chemistry, and Biology/Mathematics.',
    min_qualification: '12th',
    duration_months: 48,
    skills_developed: ['Pharmacology', 'Pharmaceutical Chemistry', 'Clinical Pharmacy', 'Drug Formulation', 'Quality Assurance'],
    career_outcomes: 'Pharmacist, Drug Safety Associate, Quality Control Chemist, Formulation Scientist',
    status: 'published'
  }
];

async function seed() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('Connected!');

  // 1. Seed courses
  console.log('Ensuring courses exist in DB...');
  for (const c of ADDITIONAL_COURSES) {
    await client.query(`
      insert into courses (
        id, slug, name, short_name, level, stream, description, eligibility_text,
        min_qualification, duration_months, skills_developed, career_outcomes, status
      ) values ($1, $2, $3, $4, $5::course_level, $6, $7, $8, $9, $10, $11, $12, $13::content_status)
      on conflict (slug) do update set
        name = excluded.name,
        short_name = excluded.short_name,
        level = excluded.level,
        stream = excluded.stream,
        description = excluded.description,
        eligibility_text = excluded.eligibility_text,
        skills_developed = excluded.skills_developed,
        career_outcomes = excluded.career_outcomes,
        status = excluded.status
    `, [
      c.id, c.slug, c.name, c.short_name, c.level, c.stream, c.description,
      c.eligibility_text, c.min_qualification, c.duration_months,
      c.skills_developed, c.career_outcomes, c.status
    ]);
  }
  console.log('Courses seeded.');

  // Fetch course slug -> id map
  const coursesRes = await client.query('select id, slug from courses');
  const courseMap = {};
  for (const row of coursesRes.rows) {
    courseMap[row.slug] = row.id;
  }

  // 2. Load colleges payload
  console.log('Reading colleges payload JSON...');
  const payloadRaw = fs.readFileSync(payloadPath, 'utf-8');
  const colleges = JSON.parse(payloadRaw);
  console.log(`Loaded ${colleges.length} institutions from JSON.`);

  // 3. Batch insert institutions
  const BATCH_SIZE = 150;
  console.log(`Inserting institutions in batches of ${BATCH_SIZE}...`);

  const institutionCourseLinks = [];

  for (let i = 0; i < colleges.length; i += BATCH_SIZE) {
    const batch = colleges.slice(i, i + BATCH_SIZE);
    const valueClauses = [];
    const values = [];

    batch.forEach((col, idx) => {
      const offset = idx * 21;
      valueClauses.push(`(
        $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
        $${offset + 5}::institution_type, $${offset + 6}::institution_ownership,
        $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10},
        $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14},
        $${offset + 15}, $${offset + 16}::jsonb, $${offset + 17}::jsonb,
        $${offset + 18}::text[], $${offset + 19}, $${offset + 20},
        $${offset + 21}::content_status, now()
      )`);

      values.push(
        col.id,
        col.slug,
        col.name,
        col.short_name,
        col.type,
        col.ownership,
        col.state_code,
        col.district,
        col.city,
        col.address,
        col.pincode,
        col.website,
        col.description,
        col.ranking_text,
        col.fees_text,
        JSON.stringify(col.accreditation),
        JSON.stringify(col.placement_stats),
        col.campus_facilities,
        col.contact_email,
        col.contact_phone,
        col.status
      );

      // Collect course links
      if (col.courses && col.courses.length > 0) {
        for (const cslug of col.courses) {
          const cid = courseMap[cslug];
          if (cid) {
            institutionCourseLinks.push({
              institution_id: col.id,
              course_id: cid
            });
          }
        }
      }
    });

    const queryText = `
      insert into institutions (
        id, slug, name, short_name, type, ownership, state_code, district, city, address,
        pincode, website, description, ranking_text, fees_text, accreditation,
        placement_stats, campus_facilities, contact_email, contact_phone, status, last_verified_at
      ) values ${valueClauses.join(', ')}
      on conflict (slug) do update set
        name = excluded.name,
        short_name = excluded.short_name,
        type = excluded.type,
        ownership = excluded.ownership,
        state_code = excluded.state_code,
        district = excluded.district,
        city = excluded.city,
        address = excluded.address,
        pincode = excluded.pincode,
        website = excluded.website,
        description = excluded.description,
        ranking_text = excluded.ranking_text,
        fees_text = excluded.fees_text,
        accreditation = excluded.accreditation,
        placement_stats = excluded.placement_stats,
        campus_facilities = excluded.campus_facilities,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        status = excluded.status,
        last_verified_at = now()
    `;

    await client.query(queryText, values);
    process.stdout.write(`\rInserted institutions: ${Math.min(i + BATCH_SIZE, colleges.length)} / ${colleges.length}`);
  }

  console.log('\nAll institutions inserted/updated successfully!');

  // 4. Batch insert institution_courses
  console.log(`Inserting ${institutionCourseLinks.length} course offerings...`);
  const LINK_BATCH_SIZE = 500;
  for (let i = 0; i < institutionCourseLinks.length; i += LINK_BATCH_SIZE) {
    const linkBatch = institutionCourseLinks.slice(i, i + LINK_BATCH_SIZE);
    const valueClauses = [];
    const values = [];

    linkBatch.forEach((lnk, idx) => {
      const offset = idx * 6;
      valueClauses.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      values.push(
        lnk.institution_id,
        lnk.course_id,
        'Annual Tuition Fee: Data not given / Concessions available for SC/ST/EWS',
        48,
        'Accepted entrance examinations: JEE Main / State CET / Merit Counselling · Data not given',
        'regular'
      );
    });

    const linkQuery = `
      insert into institution_courses (
        institution_id, course_id, fees_text, duration_months, admission_process, mode
      ) values ${valueClauses.join(', ')}
      on conflict (institution_id, course_id) do nothing
    `;

    await client.query(linkQuery, values);
    process.stdout.write(`\rLinked institution courses: ${Math.min(i + LINK_BATCH_SIZE, institutionCourseLinks.length)} / ${institutionCourseLinks.length}`);
  }

  console.log('\nAll course links inserted!');

  // 5. Final Count verification
  const totalInstRes = await client.query('select count(*) from institutions');
  const totalLinksRes = await client.query('select count(*) from institution_courses');
  const sampleRes = await client.query(`
    select name, short_name, city, state_code, ranking_text, fees_text, accreditation->>'aicte_id' as aicte_id
    from institutions
    where ranking_text is not null
    order by random()
    limit 3
  `);

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Total Institutions in DB: ${totalInstRes.rows[0].count}`);
  console.log(`Total Institution Courses in DB: ${totalLinksRes.rows[0].count}`);
  console.log('Sample Institutions from DB:');
  console.log(sampleRes.rows);

  await client.end();
  console.log('Database connection closed cleanly.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
