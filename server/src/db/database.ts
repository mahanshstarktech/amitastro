import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'nakshaktram.db');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${DB_PATH}`);
  }
});

// Helper for promise-based queries
export const runQuery = (sql: string, params: any[] = []): Promise<{ id?: number; changes?: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getOne = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const getAll = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export async function initDatabase() {
  db.serialize(async () => {
    // Enable WAL mode for high concurrency
    db.run('PRAGMA journal_mode = WAL;');

    // Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT DEFAULT 'customer',
        is_phone_verified INTEGER DEFAULT 0,
        trial_used INTEGER DEFAULT 0,
        trial_seconds_remaining INTEGER DEFAULT 300,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Birth Profiles (Many to one with user)
    db.run(`
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

    // Packages
    db.run(`
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

    // Appointments
    db.run(`
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
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (birth_profile_id) REFERENCES birth_profiles(id),
        FOREIGN KEY (package_id) REFERENCES packages(id)
      );
    `);

    // Payments
    db.run(`
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

    // Categories
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        parent_id TEXT,
        description TEXT
      );
    `);

    // Blog Posts
    db.run(`
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

    // Chat Conversations
    db.run(`
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

    // Chat Messages
    db.run(`
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

    // Availability & Working Hours
    db.run(`
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

    // Blackout Dates
    db.run(`
      CREATE TABLE IF NOT EXISTS blackout_dates (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        reason TEXT
      );
    `);

    // Customer CRM Meta (private admin notes and tags)
    db.run(`
      CREATE TABLE IF NOT EXISTS customer_crm_meta (
        user_id TEXT PRIMARY KEY,
        internal_notes TEXT,
        tags_json TEXT DEFAULT '[]',
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Broadcasts
    db.run(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        channels_json TEXT NOT NULL,
        target_segment TEXT DEFAULT 'all',
        sent_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // OTP verification store
    db.run(`
      CREATE TABLE IF NOT EXISTS otps (
        phone TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0
      );
    `);

    // Audit logs
    db.run(`
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

    // Seed Data
    await seedInitialData();
  });
}

async function seedInitialData() {
  const adminExists = await getOne('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!adminExists) {
    console.log('Seeding initial Nakshaktram platform data...');

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Nakshaktram@2026', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@123', salt);

    // 1. Admin Amit Soni
    await runQuery(`
      INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, ['admin-amit-soni', 'Amit Soni', 'admin@nakshaktram.com', '+919876543210', adminPasswordHash, 'admin']);

    // 2. Demo Customer (Priya Sharma)
    await runQuery(`
      INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified, trial_used, trial_seconds_remaining)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, 300)
    `, ['cust-priya-sharma', 'Priya Sharma', 'priya.sharma@example.com', '+919811122233', customerPasswordHash, 'customer']);

    // Demo customer birth profiles
    await runQuery(`
      INSERT INTO birth_profiles (id, user_id, relation, full_name, dob, tob, tob_uncertain, pob, pob_lat, pob_lng, pob_timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['bp-priya-self', 'cust-priya-sharma', 'self', 'Priya Sharma', '1992-08-14', '07:25', 0, 'Jaipur, Rajasthan', 26.9124, 75.7873, 'Asia/Kolkata']);

    await runQuery(`
      INSERT INTO birth_profiles (id, user_id, relation, full_name, dob, tob, tob_uncertain, pob, pob_lat, pob_lng, pob_timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['bp-priya-spouse', 'cust-priya-sharma', 'spouse', 'Rahul Sharma', '1989-11-23', '14:40', 0, 'New Delhi, Delhi', 28.6139, 77.2090, 'Asia/Kolkata']);

    // CRM notes for demo customer
    await runQuery(`
      INSERT INTO customer_crm_meta (user_id, internal_notes, tags_json)
      VALUES (?, ?, ?)
    `, ['cust-priya-sharma', 'Prefers consultations in Hindi. Interested in career transit guidance and Vastu for new apartment.', JSON.stringify(['VIP', 'Career Focus', 'Prefers Hindi'])]);

    // 3. Packages (Section 13)
    const packages = [
      {
        id: 'pkg-trial',
        slug: 'trial',
        name: 'Trial Session',
        price: 0,
        duration: 5,
        includes: JSON.stringify([
          '5-Minute Discovery Call',
          'Shared Trial Chat Budget',
          'Primary Kundli Highlight',
          'One-time First Session Only'
        ]),
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
        includes: JSON.stringify([
          '15-Minute Focused Call',
          'One Specific Query Analysis',
          'Chat Follow-up Add-on Optional (₹100)',
          'Instant Slot Scheduling'
        ]),
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
        includes: JSON.stringify([
          '30-Minute Comprehensive Call',
          'Kundli & Dasha Breakdown',
          '3-Day Follow-up In-App Chat',
          'Core Astrological Remedies'
        ]),
        is_popular: 0,
        is_trial: 0,
        decoy: 'Decoy tier — Premium offers 2x time + remedies for only ₹800 more',
        cost_per_min: 33.30
      },
      {
        id: 'pkg-premium',
        slug: 'premium',
        name: 'Premium Deep Consult',
        price: 1799,
        duration: 60,
        includes: JSON.stringify([
          '45–60 Minute In-Depth Session',
          'Detailed Written Remedies PDF Report',
          '7-Day Direct Follow-up In-App Chat',
          'Priority Scheduling & Family Chart Glance',
          'Gemstone & Vastu Guidance'
        ]),
        is_popular: 1,
        is_trial: 0,
        decoy: 'Best value per minute with complete lifetime report',
        cost_per_min: 29.98
      }
    ];

    for (const pkg of packages) {
      await runQuery(`
        INSERT INTO packages (id, slug, name, price, duration_minutes, includes_json, is_popular, is_trial, decoy_note, per_minute_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [pkg.id, pkg.slug, pkg.name, pkg.price, pkg.duration, pkg.includes, pkg.is_popular, pkg.is_trial, pkg.decoy, pkg.cost_per_min]);
    }

    // 4. Categories & Subcategories (Section 5)
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

    // 5. Featured Blog Posts
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

## How Amit Soni Analyzes Your Dasha Sequence

During a 1-on-1 consultation at Nakshaktram, we examine:
1. **The dignity and strength (Shadbala)** of the ruling Dasha lord.
2. **The House transit connections** — where the planet is currently moving relative to your Moon sign (*Chandra Lagna*).
3. **Targeted Sattvic Remedies** — specific affirmations, mindful donations, and gemstones that align your vibrational field with positive cosmic currents.
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
- When cooking, position the burner so the cook faces East toward the morning sun.

## 3. The Master Bedroom in the South-West (Nairutya Kon)

Governed by the Earth element (*Prithvi*), the South-West provides grounding, stability, and executive leadership.
- The master of the household should ideally rest in this corner to nurture enduring relationships and sound sleep.

## Consultation with Amit Soni

Vastu modifications in modern apartments do **not** require costly demolition. Through directional pyramids, sacred brass strips, lighting realignments, and indoor botanical placement, we can rectify energetic misalignments naturally.
        `
      },
      {
        id: 'post-3',
        slug: 'saturn-sade-sati-myths-vs-reality',
        title: 'Saturn’s Sade Sati: Dispelling the Fear and Embracing Karmic Transformation',
        excerpt: 'Sade Sati is widely feared, but ancient sages described it as a great refiner. Understand the three 2.5-year phases and how to channel Shani’s blessing.',
        category_id: 'cat-transits',
        tags: JSON.stringify(['Saturn', 'Sade Sati', 'Transits', 'Karmic Growth']),
        hero_image_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
        reading_time: 7,
        is_featured: 1,
        content: `
# Saturn’s Sade Sati: Dispelling the Fear

Few astrological phenomena carry as much folklore as **Sade Sati** — the 7.5-year transit of Saturn (*Shani Dev*) over the natal Moon sign. Popular myths suggest catastrophe, but authentic Vedic texts reveal a far more uplifting reality: Saturn is a mentor, not a punisher.

## The Three Phases (Dhaiyas)

1. **First Phase (Rising Phase - 2.5 Years)**: Saturn traverses the 12th house from your natal Moon. This phase prompts introspection, re-evaluation of financial overheads, and letting go of unnecessary attachments.
2. **Second Phase (Peak Phase - 2.5 Years)**: Saturn conjuncts your natal Moon in the 1st house. Emotional resilience is tested, discipline becomes compulsory, and deep self-honesty emerges.
3. **Third Phase (Setting Phase - 2.5 Years)**: Saturn moves into the 2nd house from the Moon. Financial consolidation, career rewards for diligent efforts, and peace of mind return.

## Authentic Remedies That Work

- **Selfless Service**: Shani honors humility. Serving the underprivileged, elder care, and feeding animals (especially crows and black dogs on Saturdays).
- **Saturday Oil Diya**: Lighting a mustard oil lamp under a Peepal tree at dusk.
- **Mantra Sadhana**: Regular chanting of *Om Sham Shanaishcharaye Namah* or the *Hanuman Chalisa*.
        `
      },
      {
        id: 'post-4',
        slug: 'choosing-the-right-gemstone-vedic-rules',
        title: 'The Science of Ratna: Why You Should Never Wear a Gemstone Without Chart Analysis',
        excerpt: 'Gemstones act as cosmic prism lenses for planetary rays. Learn why generic sun-sign gemstone recommendations often do more harm than good.',
        category_id: 'cat-gemstones',
        tags: JSON.stringify(['Gemstones', 'Yellow Sapphire', 'Blue Sapphire', 'Emerald']),
        hero_image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80',
        reading_time: 5,
        is_featured: 0,
        content: `
# The Science of Ratna (Gemstones)

In Vedic gemmology (*Ratna Shastra*), natural gemstones are concentrated crystalline conductors that resonate with specific light spectrums emitted by the celestial spheres.

## Why Sun-Sign Stones Can Be Risky

Western astrology often suggests birthstones based solely on the month or Sun sign. In contrast, Vedic astrology evaluates:
- **Your Ascendant (Lagna) Lord**: Is the planet a functional benefic for your unique constitution?
- **Trika House Rulership**: If a planet rules difficult houses (6th, 8th, or 12th), strengthening it with a gemstone can inadvertently amplify obstacles.
- **Natural Compatibility**: Wearing inimical stones together (such as Blue Sapphire and Ruby) creates energetic discord.

At Nakshaktram, Amit Soni prescribes only high-vibrational, untreated natural gemstones tailored to your planetary periods (*Dasha*).
        `
      }
    ];

    for (const post of blogPosts) {
      await runQuery(`
        INSERT INTO blog_posts (id, slug, title, excerpt, content_markdown, category_id, tags_json, hero_image_url, reading_time_min, is_featured, is_published, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `, [post.id, post.slug, post.title, post.excerpt, post.content, post.category_id, post.tags, post.hero_image_url, post.reading_time, post.is_featured, post.title, post.excerpt]);
    }

    // 6. Working Hours Rules (Section 8 — 9AM-5PM and 8PM-12AM IST)
    for (let day = 0; day <= 6; day++) {
      await runQuery(`
        INSERT INTO availability_rules (weekday, window1_start, window1_end, window2_start, window2_end, slot_duration, buffer_time, is_active)
        VALUES (?, '09:00', '17:00', '20:00', '23:59', 30, 10, 1)
      `, [day]);
    }

    // 7. Seed sample appointment and payment verification queue item
    const sampleApptId = 'appt-demo-priya';
    await runQuery(`
      INSERT INTO appointments (id, customer_id, birth_profile_id, package_id, consultation_type, requested_date, requested_time_window, timezone_user, customer_notes, status)
      VALUES (?, ?, ?, ?, 'call', '2026-09-18', '11:00 AM - 01:00 PM', 'Asia/Kolkata', 'Seeking career transition guidance and clarity on current Dasha.', 'Requested')
    `, [sampleApptId, 'cust-priya-sharma', 'bp-priya-self', 'pkg-premium']);

    // Sample payment awaiting verification
    await runQuery(`
      INSERT INTO payments (id, appointment_id, user_id, amount, payment_method, utr_reference, screenshot_url, status)
      VALUES (?, ?, ?, 1799, 'upi_qr', '425981029384', 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&q=80', 'Pending')
    `, ['pay-demo-priya', sampleApptId, 'cust-priya-sharma']);

    // 8. Seed Chat Conversation
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

    console.log('Database seeded successfully with initial Nakshaktram platform records!');
  }
}
