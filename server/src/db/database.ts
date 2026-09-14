import sqlite3 from 'sqlite3';
import { Pool, QueryResult } from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'));

let sqliteDb: sqlite3.Database | null = null;
let pgPool: Pool | null = null;

if (isPostgres) {
  console.log('Connecting to Production Cloud PostgreSQL Database...');
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  const DB_DIR = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'nakshaktram.db');
  sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log(`Connected to Local SQLite database at ${DB_PATH}`);
    }
  });
}

// Convert SQLite '?' placeholders to PostgreSQL '$1, $2, ...'
function formatSqlForEngine(sql: string): string {
  if (!isPostgres) return sql;
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

// Universal Query Runners
export const runQuery = async (sql: string, params: any[] = []): Promise<{ id?: number | string; changes?: number }> => {
  if (isPostgres && pgPool) {
    const formatted = formatSqlForEngine(sql);
    const res: QueryResult = await pgPool.query(formatted, params);
    return { changes: res.rowCount || 0 };
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
  throw new Error('No database connection initialized');
};

export const getOne = async <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  if (isPostgres && pgPool) {
    const formatted = formatSqlForEngine(sql);
    const res: QueryResult = await pgPool.query(formatted, params);
    return (res.rows[0] as T) || undefined;
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }
  throw new Error('No database connection initialized');
};

export const getAll = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  if (isPostgres && pgPool) {
    const formatted = formatSqlForEngine(sql);
    const res: QueryResult = await pgPool.query(formatted, params);
    return (res.rows as T[]) || [];
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows as T[]) || []);
      });
    });
  }
  throw new Error('No database connection initialized');
};

export async function initDatabase() {
  if (isPostgres && pgPool) {
    await initPostgresSchema();
  } else if (sqliteDb) {
    await initSqliteSchema();
  }
  await seedInitialData();
}

async function initPostgresSchema() {
  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(64) UNIQUE NOT NULL,
      password_hash TEXT,
      role VARCHAR(32) DEFAULT 'customer',
      is_phone_verified INT DEFAULT 0,
      is_email_verified INT DEFAULT 0,
      is_new_customer INT DEFAULT 1,
      trial_used INT DEFAULT 0,
      trial_seconds_remaining INT DEFAULT 300,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS birth_profiles (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      relation VARCHAR(32) DEFAULT 'self',
      full_name VARCHAR(255) NOT NULL,
      dob VARCHAR(32) NOT NULL,
      tob VARCHAR(32) NOT NULL,
      tob_uncertain INT DEFAULT 0,
      pob VARCHAR(255) NOT NULL,
      pob_lat FLOAT,
      pob_lng FLOAT,
      pob_timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      price INT NOT NULL,
      duration_minutes INT NOT NULL,
      includes_json TEXT NOT NULL,
      is_popular INT DEFAULT 0,
      is_trial INT DEFAULT 0,
      decoy_note TEXT,
      per_minute_cost FLOAT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(64) PRIMARY KEY,
      customer_id VARCHAR(64) NOT NULL REFERENCES users(id),
      birth_profile_id VARCHAR(64) NOT NULL REFERENCES birth_profiles(id),
      package_id VARCHAR(64) NOT NULL REFERENCES packages(id),
      consultation_type VARCHAR(32) DEFAULT 'call',
      requested_date VARCHAR(32) NOT NULL,
      requested_time_window VARCHAR(64) NOT NULL,
      confirmed_time_ist VARCHAR(64),
      timezone_user VARCHAR(64) DEFAULT 'Asia/Kolkata',
      customer_notes TEXT,
      status VARCHAR(32) DEFAULT 'Requested',
      followup_days INT DEFAULT 0,
      followup_chat_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      appointment_id VARCHAR(64) REFERENCES appointments(id),
      user_id VARCHAR(64) NOT NULL REFERENCES users(id),
      amount INT NOT NULL,
      payment_method VARCHAR(32) DEFAULT 'upi_qr',
      utr_reference VARCHAR(128),
      screenshot_url TEXT,
      status VARCHAR(32) DEFAULT 'Pending',
      rejection_reason TEXT,
      verified_by VARCHAR(64),
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(64) UNIQUE NOT NULL,
      parent_id VARCHAR(64),
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(128) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      category_id VARCHAR(64) NOT NULL REFERENCES categories(id),
      tags_json TEXT,
      hero_image_url TEXT,
      reading_time_min INT DEFAULT 5,
      is_featured INT DEFAULT 0,
      is_published INT DEFAULT 1,
      meta_title VARCHAR(255),
      meta_description TEXT,
      published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id VARCHAR(64) PRIMARY KEY,
      customer_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id),
      admin_id VARCHAR(64) DEFAULT 'admin-amit-soni',
      is_locked INT DEFAULT 0,
      trial_expires_at TIMESTAMP,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unread_admin_count INT DEFAULT 0,
      unread_customer_count INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(64) PRIMARY KEY,
      conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id),
      sender_type VARCHAR(32) NOT NULL,
      sender_id VARCHAR(64) NOT NULL,
      message_type VARCHAR(32) DEFAULT 'text',
      content TEXT NOT NULL,
      attachment_url TEXT,
      is_read INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS availability_rules (
      id SERIAL PRIMARY KEY,
      weekday INT NOT NULL UNIQUE,
      window1_start VARCHAR(16) DEFAULT '09:00',
      window1_end VARCHAR(16) DEFAULT '17:00',
      window2_start VARCHAR(16) DEFAULT '20:00',
      window2_end VARCHAR(16) DEFAULT '23:59',
      slot_duration INT DEFAULT 30,
      buffer_time INT DEFAULT 10,
      is_active INT DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS blackout_dates (
      id VARCHAR(64) PRIMARY KEY,
      date VARCHAR(32) NOT NULL UNIQUE,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS customer_crm_meta (
      user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id),
      internal_notes TEXT,
      tags_json TEXT DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS broadcasts (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      channels_json TEXT NOT NULL,
      target_segment VARCHAR(64) DEFAULT 'all',
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otps (
      phone VARCHAR(64) PRIMARY KEY,
      code VARCHAR(16) NOT NULL,
      expires_at BIGINT NOT NULL,
      attempts INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      action VARCHAR(128) NOT NULL,
      target_type VARCHAR(64),
      target_id VARCHAR(64),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS followup_messages (
      id VARCHAR(64) PRIMARY KEY,
      appointment_id VARCHAR(64) NOT NULL REFERENCES appointments(id),
      sender_type VARCHAR(32) NOT NULL,
      sender_id VARCHAR(64) NOT NULL,
      content TEXT NOT NULL,
      attachment_url TEXT,
      is_read INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pgPool!.query(ddl);
  // Safe migrations for existing databases
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_new_customer INT DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified INT DEFAULT 0`,
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS followup_days INT DEFAULT 0`,
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS followup_chat_expires_at TIMESTAMP`,
  ];
  for (const m of migrations) {
    try { await pgPool!.query(m); } catch (_) { /* column already exists */ }
  }
  console.log('PostgreSQL schema initialized successfully!');
}

async function initSqliteSchema() {
  return new Promise<void>((resolve) => {
    sqliteDb!.serialize(() => {
      sqliteDb!.run('PRAGMA journal_mode = WAL;');

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          role TEXT DEFAULT 'customer',
          is_phone_verified INTEGER DEFAULT 0,
          is_email_verified INTEGER DEFAULT 0,
          is_new_customer INTEGER DEFAULT 1,
          trial_used INTEGER DEFAULT 0,
          trial_seconds_remaining INTEGER DEFAULT 300,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS birth_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          relation TEXT DEFAULT 'self',
          full_name TEXT NOT NULL,
          dob TEXT NOT NULL,
          tob TEXT NOT NULL,
          tob_uncertain INTEGER DEFAULT 0,
          pob TEXT NOT NULL,
          pob_lat REAL,
          pob_lng REAL,
          pob_timezone TEXT DEFAULT 'Asia/Kolkata',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS packages (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          duration_minutes INTEGER NOT NULL,
          includes_json TEXT NOT NULL,
          is_popular INTEGER DEFAULT 0,
          is_trial INTEGER DEFAULT 0,
          decoy_note TEXT,
          per_minute_cost REAL
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          birth_profile_id TEXT NOT NULL,
          package_id TEXT NOT NULL,
          consultation_type TEXT DEFAULT 'call',
          requested_date TEXT NOT NULL,
          requested_time_window TEXT NOT NULL,
          confirmed_time_ist TEXT,
          timezone_user TEXT DEFAULT 'Asia/Kolkata',
          customer_notes TEXT,
          status TEXT DEFAULT 'Requested',
          followup_days INTEGER DEFAULT 0,
          followup_chat_expires_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (customer_id) REFERENCES users(id),
          FOREIGN KEY (birth_profile_id) REFERENCES birth_profiles(id),
          FOREIGN KEY (package_id) REFERENCES packages(id)
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          appointment_id TEXT,
          user_id TEXT NOT NULL,
          amount INTEGER NOT NULL,
          payment_method TEXT DEFAULT 'upi_qr',
          utr_reference TEXT,
          screenshot_url TEXT,
          status TEXT DEFAULT 'Pending',
          rejection_reason TEXT,
          verified_by TEXT,
          verified_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (appointment_id) REFERENCES appointments(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          parent_id TEXT,
          description TEXT
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content_markdown TEXT NOT NULL,
          category_id TEXT NOT NULL,
          tags_json TEXT,
          hero_image_url TEXT,
          reading_time_min INTEGER DEFAULT 5,
          is_featured INTEGER DEFAULT 0,
          is_published INTEGER DEFAULT 1,
          meta_title TEXT,
          meta_description TEXT,
          published_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS chat_conversations (
          id TEXT PRIMARY KEY,
          customer_id TEXT UNIQUE NOT NULL,
          admin_id TEXT DEFAULT 'admin-amit-soni',
          is_locked INTEGER DEFAULT 0,
          trial_expires_at TEXT,
          last_message_at TEXT DEFAULT (datetime('now')),
          unread_admin_count INTEGER DEFAULT 0,
          unread_customer_count INTEGER DEFAULT 0,
          FOREIGN KEY (customer_id) REFERENCES users(id)
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          sender_type TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          content TEXT NOT NULL,
          attachment_url TEXT,
          is_read INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS availability_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          weekday INTEGER NOT NULL UNIQUE,
          window1_start TEXT DEFAULT '09:00',
          window1_end TEXT DEFAULT '17:00',
          window2_start TEXT DEFAULT '20:00',
          window2_end TEXT DEFAULT '23:59',
          slot_duration INTEGER DEFAULT 30,
          buffer_time INTEGER DEFAULT 10,
          is_active INTEGER DEFAULT 1
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS blackout_dates (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL UNIQUE,
          reason TEXT
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS customer_crm_meta (
          user_id TEXT PRIMARY KEY,
          internal_notes TEXT,
          tags_json TEXT DEFAULT '[]',
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS broadcasts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          channels_json TEXT NOT NULL,
          target_segment TEXT DEFAULT 'all',
          sent_at TEXT DEFAULT (datetime('now'))
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS otps (
          phone TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          attempts INTEGER DEFAULT 0
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          admin_id TEXT NOT NULL,
          action TEXT NOT NULL,
          target_type TEXT,
          target_id TEXT,
          details TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      sqliteDb!.run(`
        CREATE TABLE IF NOT EXISTS followup_messages (
          id TEXT PRIMARY KEY,
          appointment_id TEXT NOT NULL,
          sender_type TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          content TEXT NOT NULL,
          attachment_url TEXT,
          is_read INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        );
      `);

      // Safe migrations for existing SQLite databases
      sqliteDb!.run(`ALTER TABLE users ADD COLUMN is_new_customer INTEGER DEFAULT 1`, () => {});
      sqliteDb!.run(`ALTER TABLE appointments ADD COLUMN followup_days INTEGER DEFAULT 0`, () => {});
      sqliteDb!.run(`ALTER TABLE appointments ADD COLUMN followup_chat_expires_at TEXT`, () => {
        resolve();
      });
    });
  });
}

async function seedInitialData() {
  const adminExists = await getOne('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!adminExists) {
    console.log('Seeding initial Nakshaktram platform records...');

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Nakshaktram@2026', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@123', salt);

    // Admin Amit Soni
    await runQuery(`
      INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified, is_new_customer)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0)
    `, ['admin-amit-soni', 'Amit Soni', 'admin@nakshaktram.com', '+919876543210', adminPasswordHash, 'admin']);

    // Demo Customer (Priya Sharma)
    await runQuery(`
      INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified, is_new_customer, trial_used, trial_seconds_remaining)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, 300)
    `, ['cust-priya-sharma', 'Priya Sharma', 'priya.sharma@example.com', '+919811122233', customerPasswordHash, 'customer']);

    // Demo Customer Birth Profiles
    await runQuery(`
      INSERT INTO birth_profiles (id, user_id, relation, full_name, dob, tob, tob_uncertain, pob, pob_lat, pob_lng, pob_timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['bp-priya-self', 'cust-priya-sharma', 'self', 'Priya Sharma', '1992-08-14', '07:25', 0, 'Jaipur, Rajasthan', 26.9124, 75.7873, 'Asia/Kolkata']);

    await runQuery(`
      INSERT INTO birth_profiles (id, user_id, relation, full_name, dob, tob, tob_uncertain, pob, pob_lat, pob_lng, pob_timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['bp-priya-spouse', 'cust-priya-sharma', 'spouse', 'Rahul Sharma', '1989-11-23', '14:40', 0, 'New Delhi, Delhi', 28.6139, 77.2090, 'Asia/Kolkata']);

    // CRM meta
    await runQuery(`
      INSERT INTO customer_crm_meta (user_id, internal_notes, tags_json)
      VALUES (?, ?, ?)
    `, ['cust-priya-sharma', 'Prefers consultations in Hindi. Interested in career transit guidance and Vastu for new apartment.', JSON.stringify(['VIP', 'Career Focus', 'Prefers Hindi'])]);

    // Packages
    const packages = [
      {
        id: 'pkg-trial',
        slug: 'trial',
        name: 'Trial Session',
        price: 0,
        duration: 5,
        includes: JSON.stringify(['5-Minute Discovery Call', 'Shared Trial Chat Budget', 'Primary Kundli Highlight', 'One-time First Session Only']),
        is_popular: 0,
        is_trial: 1,
        decoy: 'First session only',
        cost_per_min: 0
      },
      {
        id: 'pkg-quick',
        slug: 'quick-consult',
        name: 'Quick Consult',
        price: 500,
        duration: 15,
        includes: JSON.stringify(['15-Minute Focused Call', 'One Specific Query Analysis', 'Chat Follow-up Add-on Optional (₹100)', 'Instant Slot Scheduling']),
        is_popular: 0,
        is_trial: 0,
        decoy: 'For quick pressing questions',
        cost_per_min: 33.33
      },
      {
        id: 'pkg-standard',
        slug: 'standard',
        name: 'Standard Consult',
        price: 999,
        duration: 30,
        includes: JSON.stringify(['30-Minute Comprehensive Call', 'Kundli & Dasha Breakdown', '3-Day Follow-up In-App Chat', 'Core Astrological Remedies']),
        is_popular: 0,
        is_trial: 0,
        decoy: 'Decoy tier — Premium offers 2x time + remedies for only ₹800 more',
        cost_per_min: 33.30,
        followup_days: 3
      },
      {
        id: 'pkg-premium',
        slug: 'premium',
        name: 'Premium Deep Consult',
        price: 1799,
        duration: 60,
        includes: JSON.stringify(['45–60 Minute In-Depth Session', 'Detailed Written Remedies PDF Report', '7-Day Direct Follow-up In-App Chat', 'Priority Scheduling & Family Chart Glance', 'Gemstone & Vastu Guidance']),
        is_popular: 1,
        is_trial: 0,
        decoy: 'Best value per minute with complete lifetime report',
        cost_per_min: 29.98,
        followup_days: 7
      }
    ];

    for (const pkg of packages) {
      await runQuery(`
        INSERT INTO packages (id, slug, name, price, duration_minutes, includes_json, is_popular, is_trial, decoy_note, per_minute_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [pkg.id, pkg.slug, pkg.name, pkg.price, pkg.duration, pkg.includes, pkg.is_popular, pkg.is_trial, pkg.decoy, pkg.cost_per_min]);
    }

    // Categories
    const categories = [
      { id: 'cat-vedic', name: 'Vedic Astrology', slug: 'vedic', parent_id: null, desc: 'Foundational principles of ancient Vedic astrology, karma, and cosmic cycles.' },
      { id: 'cat-vastu', name: 'Vastu Shastra', slug: 'vastu', parent_id: null, desc: 'Harmonizing living and working spaces with directional energies.' },
      { id: 'cat-vastu-home', name: 'Home Vastu', slug: 'home-vastu', parent_id: 'cat-vastu', desc: 'Practical home orientation, master bedroom, kitchen, and entrance guidance.' },
      { id: 'cat-vastu-biz', name: 'Business Vastu', slug: 'business-vastu', parent_id: 'cat-vastu', desc: 'Commercial spaces, shop entrances, cash counter placement, and industrial layouts.' },
      { id: 'cat-kundli', name: 'Kundli & Horoscope', slug: 'kundli', parent_id: null, desc: 'Birth chart anatomy, planetary houses, dashas, and yogas explained clearly.' },
      { id: 'cat-transits', name: 'Planetary Transits', slug: 'transits', parent_id: null, desc: 'Saturn Sade Sati, Jupiter transit, Rahu-Ketu shifts, and seasonal shifts.' },
      { id: 'cat-festivals', name: 'Vedic Festivals & Muhurat', slug: 'festivals', parent_id: null, desc: 'Auspicious timings, Diwali muhurat, Navratri sadhana, and Ekadashi dates.' },
      { id: 'cat-gemstones', name: 'Gemstones & Ratna', slug: 'gemstones', parent_id: null, desc: 'Authentic gemstone recommendations, metal pairing, and activation mantras.' },
      { id: 'cat-numerology', name: 'Numerology & Ank Jyotish', slug: 'numerology', parent_id: null, desc: 'Life path numbers, name vibration correction, and master numbers.' }
    ];

    for (const cat of categories) {
      await runQuery(`
        INSERT INTO categories (id, name, slug, parent_id, description)
        VALUES (?, ?, ?, ?, ?)
      `, [cat.id, cat.name, cat.slug, cat.parent_id, cat.desc]);
    }

    // Blog Posts
    const blogPosts = [
      {
        id: 'post-1',
        slug: 'understanding-mahadasha-and-antardasha',
        title: 'Demystifying Mahadasha & Antardasha: How Planetary Periods Shape Your Life',
        excerpt: 'Vedic astrology views human life through rhythmic planetary rulers known as Dashas. Discover how Mahadashas unveil your past karma and unfolding potentials.',
        category_id: 'cat-kundli',
        tags: JSON.stringify(['Kundli', 'Mahadasha', 'Vimshottari', 'Planetary Cycles']),
        hero_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        reading_time: 6,
        is_featured: 1,
        content: `
# Demystifying Mahadasha & Antardasha

In the classical Vedic tradition, your birth chart (*Janma Kundli*) is not a static prophecy. It is a dynamic blueprint that unfolds through time. The mechanism that orchestrates this unfolding is the **Vimshottari Dasha system** — a 120-year cycle divided among the nine planetary deities (*Navagraha*).

## What is a Mahadasha?

A **Mahadasha** is a major planetary period spanning several years. Depending on the planet presiding over your current cycle, certain sectors of your consciousness, career, relationships, and health come into sharp focus:

- **Jupiter (Guru) Mahadasha (16 Years)**: Expansion, wisdom, ethical clarity, children, spiritual learning, and wealth accumulation.
- **Saturn (Shani) Mahadasha (19 Years)**: Discipline, structure, karmic reckoning, persistent hard work, and profound maturity.
- **Mercury (Budha) Mahadasha (17 Years)**: Intellect, commercial acumen, communication, analytical pursuits, and agility.
- **Venus (Shukra) Mahadasha (20 Years)**: Creativity, harmony, luxury, marital bliss, and artistic expression.

## The Role of Antardasha (Sub-Period)

While the Mahadasha sets the overall climatic condition of your life, the **Antardasha** (or *Bhukti*) determines the day-to-day weather. For instance, living in a supportive Jupiter Mahadasha with a temporary Mars Antardasha can induce sudden decisive career moves or energetic real estate investments.

> "Astrology does not lock destiny into stone; it illuminates the terrain so you can navigate with grace, clarity, and timely preparation." — Amit Soni
        `
      },
      {
        id: 'post-2',
        slug: 'home-vastu-essential-principles-for-peace',
        title: 'The Sacred Geometry of Home: 5 Vastu Principles for Prosperity & Harmony',
        excerpt: 'Your physical living environment is an energetic amplifier. Learn the foundational Vastu directions that balance the five primordial elements (Pancha Bhoota).',
        category_id: 'cat-vastu-home',
        tags: JSON.stringify(['Vastu', 'Home Vastu', 'Energy Flow', 'Peace']),
        hero_image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        reading_time: 5,
        is_featured: 1,
        content: `
# The Sacred Geometry of Home

*Vastu Shastra* is the ancient Indian science of spatial harmony. When a home is aligned with the cardinal directions and the subtle flow of magnetic and solar currents, the residents experience natural serenity, vitality, and ease.

## 1. The North-East Sanctuary (Ishanya Kon)

The North-East direction corresponds to the element of Water (*Jal*) and the divine consciousness (*Shiva tattva*). 
- **Guideline**: Keep this zone impeccably clutter-free, well-lit, and lightweight.
- **Ideal use**: Meditation corner, prayer shrine (*Puja room*), or study desk.
- **Avoid**: Never place heavy storage, staircases, or bathrooms in the true North-East.

## 2. The Kitchen in the South-East (Agneya Kon)

The South-East is governed by the Fire element (*Agni*). Placing your cooking area here enhances digestive fire (*Jatharagni*), metabolic health, and household cheerfulness.
        `
      }
    ];

    for (const post of blogPosts) {
      await runQuery(`
        INSERT INTO blog_posts (id, slug, title, excerpt, content_markdown, category_id, tags_json, hero_image_url, reading_time_min, is_featured, is_published, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `, [post.id, post.slug, post.title, post.excerpt, post.content, post.category_id, post.tags, post.hero_image_url, post.reading_time, post.is_featured, post.title, post.excerpt]);
    }

    // Availability rules
    for (let day = 0; day <= 6; day++) {
      await runQuery(`
        INSERT INTO availability_rules (weekday, window1_start, window1_end, window2_start, window2_end, slot_duration, buffer_time, is_active)
        VALUES (?, '09:00', '17:00', '20:00', '23:59', 30, 10, 1)
      `, [day]);
    }

    // Seed sample appointment and payment verification queue item
    const sampleApptId = 'appt-demo-priya';
    await runQuery(`
      INSERT INTO appointments (id, customer_id, birth_profile_id, package_id, consultation_type, requested_date, requested_time_window, timezone_user, customer_notes, status)
      VALUES (?, ?, ?, ?, 'call', '2026-09-18', '11:00 AM - 01:00 PM', 'Asia/Kolkata', 'Seeking career transition guidance and clarity on current Dasha.', 'Requested')
    `, [sampleApptId, 'cust-priya-sharma', 'bp-priya-self', 'pkg-premium']);

    await runQuery(`
      INSERT INTO payments (id, appointment_id, user_id, amount, payment_method, utr_reference, screenshot_url, status)
      VALUES (?, ?, ?, 1799, 'upi_qr', '425981029384', 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&q=80', 'Pending')
    `, ['pay-demo-priya', sampleApptId, 'cust-priya-sharma']);

    // Seed Chat Conversation
    const sampleChatId = 'conv-priya';
    await runQuery(`
      INSERT INTO chat_conversations (id, customer_id, admin_id, is_locked, unread_admin_count, unread_customer_count)
      VALUES (?, ?, 'admin-amit-soni', 0, 1, 0)
    `, [sampleChatId, 'cust-priya-sharma']);

    await runQuery(`
      INSERT INTO chat_messages (id, conversation_id, sender_type, sender_id, message_type, content, is_read)
      VALUES 
        ('msg-1', ?, 'admin', 'admin-amit-soni', 'text', 'Namaste Priya ji! Welcome to Nakshaktram. I have received your birth details and request. Looking forward to our session.', 1),
        ('msg-2', ?, 'customer', 'cust-priya-sharma', 'text', 'Namaste Amit ji, thank you so much! I have submitted the payment UTR as well. Should I prepare any specific questions beforehand?', 0)
    `, [sampleChatId, sampleChatId]);

    console.log('Database seeded successfully!');
  }
}
