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
