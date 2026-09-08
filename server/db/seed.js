require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./connection');

const SALT_ROUNDS = 12;

function upsertUser({ name, email, password, role }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return existing.id;
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const info = db
    .prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    )
    .run(name, email, hash, role);
  return info.lastInsertRowid;
}

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@sprat.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

const adminId = upsertUser({
  name: 'System Administrator',
  email: adminEmail,
  password: adminPassword,
  role: 'admin',
});

const pmId = upsertUser({
  name: 'Priya Manager',
  email: 'pm@sprat.local',
  password: 'Password123!',
  role: 'project_manager',
});

const analystAId = upsertUser({
  name: 'Alex Analyst',
  email: 'analyst1@sprat.local',
  password: 'Password123!',
  role: 'analyst',
});

const analystBId = upsertUser({
  name: 'Bailey Analyst',
  email: 'analyst2@sprat.local',
  password: 'Password123!',
  role: 'analyst',
});

const guestId = upsertUser({
  name: 'Gale Guest',
  email: 'guest@sprat.local',
  password: 'Password123!',
  role: 'guest',
});

// FR-UA 1a / 2d: an administrator-created user group, with two analysts assigned to it.
let group = db.prepare('SELECT id FROM user_groups WHERE name = ?').get('NCSU TPP.org');
let groupId;
if (!group) {
  groupId = db
    .prepare('INSERT INTO user_groups (name, created_by) VALUES (?, ?)')
    .run('NCSU TPP.org', adminId).lastInsertRowid;
} else {
  groupId = group.id;
}
db.prepare('UPDATE users SET user_group_id = ? WHERE id IN (?, ?)').run(groupId, analystAId, analystBId);

let project = db.prepare('SELECT id FROM projects WHERE name = ?').get('Healthcare Privacy Review');
let projectId;
if (!project) {
  const info = db
    .prepare('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)')
    .run(
      'Healthcare Privacy Review',
      'Sample project seeded for local development and demo purposes.',
      pmId
    );
  projectId = info.lastInsertRowid;
} else {
  projectId = project.id;
}

for (const userId of [pmId, analystAId, analystBId, guestId]) {
  const exists = db
    .prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);
  if (!exists) {
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, guest_restrictions) VALUES (?, ?, ?)'
    ).run(projectId, userId, null);
  }
}

let domain = db
  .prepare('SELECT id FROM domains WHERE project_id = ? AND name = ?')
  .get(projectId, 'Healthcare');
let domainId;
if (!domain) {
  const info = db
    .prepare('INSERT INTO domains (project_id, name, created_by) VALUES (?, ?, ?)')
    .run(projectId, 'Healthcare', pmId);
  domainId = info.lastInsertRowid;
} else {
  domainId = domain.id;
}

const samplePolicyText = `This privacy policy describes how we collect, use, and share your personal
health information. We collect information you provide directly to us, such as your name, contact
details, and health history, when you register for our services. We use this information to provide
and improve our services, to communicate with you, and to comply with legal obligations under HIPAA.
We do not sell your personal information to third parties. You may access, correct, or request
deletion of your information at any time by contacting our support team. We retain your information
only as long as necessary to fulfill the purposes described in this policy. We use industry-standard
security measures to protect your data from unauthorized access, alteration, or disclosure.`;

let document = db
  .prepare('SELECT id FROM documents WHERE project_id = ? AND name = ?')
  .get(projectId, 'Sample Healthcare Privacy Policy');
let documentId;
if (!document) {
  const info = db
    .prepare(
      'INSERT INTO documents (project_id, domain_id, name, content, created_by) VALUES (?, ?, ?, ?, ?)'
    )
    .run(projectId, domainId, 'Sample Healthcare Privacy Policy', samplePolicyText, pmId);
  documentId = info.lastInsertRowid;
} else {
  documentId = document.id;
}

// FR-GSM 1: a few sample goals mined from the seeded policy document, so the
// goal/search/classification/traceability features have data to work with.
const goalSeed = [
  {
    code: 'G-1',
    description: 'Notify the user about what personal health information is collected.',
    taxonomy_category: 'protection',
    taxonomy_subtype: 'Notice/Awareness',
    granularity: 'policy',
    observable: 1,
    actor: 'Organisation',
    context: 'We collect information you provide directly to us, such as your name, contact details, and health history.',
    legislation: 'HIPAA',
    subjects: ['Personal Health Information (PHI)', 'General Information'],
  },
  {
    code: 'G-2',
    description: 'Allow the user to access, correct, or request deletion of their information.',
    taxonomy_category: 'protection',
    taxonomy_subtype: 'Access/Participation',
    granularity: 'scenario',
    observable: 1,
    actor: 'User',
    context: 'You may access, correct, or request deletion of your information at any time by contacting our support team.',
    legislation: 'HIPAA',
    subjects: ['Personally Identifiable Information (PII)', 'Security Access'],
  },
  {
    code: 'G-3',
    description: 'Retain personal information only as long as necessary for stated purposes.',
    taxonomy_category: 'vulnerability',
    taxonomy_subtype: 'Information Storage',
    granularity: 'policy',
    observable: 0,
    actor: 'Organisation',
    context: 'We retain your information only as long as necessary to fulfill the purposes described in this policy.',
    legislation: null,
    subjects: ['Policies/Procedures'],
  },
];
for (const g of goalSeed) {
  const exists = db
    .prepare('SELECT id FROM goals WHERE project_id = ? AND goal_code = ?')
    .get(projectId, g.code);
  if (exists) continue;
  const goalId = db
    .prepare(
      `INSERT INTO goals (project_id, document_id, goal_code, description, taxonomy_category,
         taxonomy_subtype, granularity, observable, actor, context_excerpt, relevant_legislation, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      projectId,
      documentId,
      g.code,
      g.description,
      g.taxonomy_category,
      g.taxonomy_subtype,
      g.granularity,
      g.observable,
      g.actor,
      g.context,
      g.legislation,
      analystAId
    ).lastInsertRowid;
  for (const subject of g.subjects) {
    db.prepare(
      'INSERT OR IGNORE INTO goal_subject_classifications (goal_id, subject_classification) VALUES (?, ?)'
    ).run(goalId, subject);
  }
  db.prepare(
    `INSERT INTO goal_document_links (goal_id, document_id, occurrence_count)
     VALUES (?, ?, 1) ON CONFLICT (goal_id, document_id) DO NOTHING`
  ).run(goalId, documentId);
}

// FR-GSM 14: a couple of goal keyword definitions for the sample project.
const keywordSeed = [
  ['ALLOW', 'The policy explicitly permits the described data practice.'],
  ['COLLECT', 'The organisation gathers the described information from or about the user.'],
];
for (const [keyword, definition] of keywordSeed) {
  const exists = db
    .prepare('SELECT id FROM keyword_definitions WHERE project_id = ? AND keyword = ?')
    .get(projectId, keyword);
  if (!exists) {
    db.prepare(
      'INSERT INTO keyword_definitions (project_id, keyword, definition, created_by) VALUES (?, ?, ?, ?)'
    ).run(projectId, keyword, definition, analystAId);
  }
}

// FR-GSM 5: one project-defined classification dimension for the sample project.
const customType = db
  .prepare('SELECT id FROM classification_types WHERE project_id = ? AND type_key = ?')
  .get(projectId, 'data_sensitivity');
if (!customType) {
  db.prepare(
    'INSERT INTO classification_types (project_id, type_key, label, options, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(
    projectId,
    'data_sensitivity',
    'Data Sensitivity',
    JSON.stringify(['low', 'moderate', 'high']),
    pmId
  );
}

console.log('Seed complete.');
console.log('--------------------------------------------------');
console.log(`Admin:            ${adminEmail} / ${adminPassword}`);
console.log('Project Manager:  pm@sprat.local / Password123!');
console.log('Analyst 1:        analyst1@sprat.local / Password123!');
console.log('Analyst 2:        analyst2@sprat.local / Password123!');
console.log('Guest:            guest@sprat.local / Password123!');
console.log('--------------------------------------------------');
console.log(`Sample project #${projectId} "Healthcare Privacy Review" with domain "Healthcare"`);
console.log(`and document #${documentId} "Sample Healthcare Privacy Policy" are ready to use.`);
