const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'data.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for maximum concurrency & reliability
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    destination TEXT,
    travel_date TEXT,
    travellers TEXT,
    travel_style TEXT,
    budget INTEGER DEFAULT 0,
    message TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'website_cta',
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS callbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    preferred_time TEXT DEFAULT 'ASAP',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    price TEXT NOT NULL,
    duration TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL
  );
`);

// Seed destinations if not already populated
const destCount = db.prepare('SELECT COUNT(*) as count FROM destinations').get().count;
if (destCount === 0) {
  const seedDestinations = [
    {
      slug: 'kashmir',
      name: 'Kashmir',
      region: 'Jammu & Kashmir',
      price: '₹48,000',
      duration: '6 days',
      image: 'https://images.unsplash.com/photo-1715457573748-8e8a70b2c1be?q=80&w=1100&auto=format&fit=crop',
      description: 'Shikara mornings on Dal Lake, meadows in bloom and saffron light over the Pir Panjal.'
    },
    {
      slug: 'ladakh',
      name: 'Ladakh',
      region: 'Ladakh',
      price: '₹62,000',
      duration: '8 days',
      image: 'https://images.unsplash.com/photo-1617824077360-7a77db40aae1?q=80&w=1100&auto=format&fit=crop',
      description: "The world's highest roads, cobalt lakes and monasteries clinging to the moonscape."
    },
    {
      slug: 'rajasthan',
      name: 'Rajasthan',
      region: 'Rajasthan',
      price: '₹74,000',
      duration: '9 days',
      image: 'https://images.unsplash.com/photo-1638904998527-a451c1fbd1cb?q=80&w=1100&auto=format&fit=crop',
      description: 'Lake palaces, honey-coloured forts and the slow drama of the Thar at dusk.'
    },
    {
      slug: 'kerala',
      name: 'Kerala',
      region: 'Kerala',
      price: '₹52,000',
      duration: '7 days',
      image: 'https://images.unsplash.com/photo-1704365159747-1f7b8913044f?q=80&w=1100&auto=format&fit=crop',
      description: 'Drift the palm-lined backwaters, then climb into the mist of Munnar\'s tea country.'
    },
    {
      slug: 'goa',
      name: 'Goa',
      region: 'Goa',
      price: '₹36,000',
      duration: '5 days',
      image: 'https://images.unsplash.com/photo-1624554305378-0f440dd3a8c1?q=80&w=1100&auto=format&fit=crop',
      description: 'Golden sand, Portuguese lanes and long, unhurried sunsets over the Arabian Sea.'
    },
    {
      slug: 'meghalaya',
      name: 'Meghalaya',
      region: 'Meghalaya',
      price: '₹44,000',
      duration: '6 days',
      image: 'https://images.unsplash.com/photo-1589983846997-04788035bc83?q=80&w=1100&auto=format&fit=crop',
      description: 'Living-root bridges, the cleanest villages on earth and Asia\'s greenest hills.'
    }
  ];

  const insertDest = db.prepare(`
    INSERT INTO destinations (slug, name, region, price, duration, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of seedDestinations) {
    insertDest.run(d.slug, d.name, d.region, d.price, d.duration, d.image, d.description);
  }
}

module.exports = {
  db,
  // Inquiries
  createInquiry(data) {
    const stmt = db.prepare(`
      INSERT INTO inquiries (name, email, phone, destination, travel_date, travellers, travel_style, budget, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.destination || 'All India',
      data.travel_date || '',
      data.travellers || '2 adults',
      data.travel_style || 'Luxury',
      Number(data.budget) || 0,
      data.message || ''
    );
    return this.getInquiryById(info.lastInsertRowid);
  },

  getInquiryById(id) {
    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  },

  getAllInquiries(filter = {}) {
    let query = 'SELECT * FROM inquiries';
    const params = [];
    const conditions = [];

    if (filter.status && filter.status !== 'all') {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    if (filter.destination && filter.destination !== 'all') {
      conditions.push('destination = ?');
      params.push(filter.destination);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    return db.prepare(query).all(...params);
  },

  updateInquiry(id, updates) {
    const fields = [];
    const values = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.budget !== undefined) {
      fields.push('budget = ?');
      values.push(Number(updates.budget) || 0);
    }

    if (fields.length === 0) return this.getInquiryById(id);

    values.push(id);
    db.prepare(`UPDATE inquiries SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getInquiryById(id);
  },

  deleteInquiry(id) {
    return db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
  },

  // Newsletter Subscribers
  addSubscriber(email, source = 'website_cta') {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const stmt = db.prepare('INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)');
      const info = stmt.run(cleanEmail, source);
      return { id: info.lastInsertRowid, email: cleanEmail, alreadySubscribed: false };
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return { email: cleanEmail, alreadySubscribed: true };
      }
      throw err;
    }
  },

  getAllSubscribers() {
    return db.prepare('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC').all();
  },

  // Callbacks
  createCallback(phone, preferred_time = 'ASAP') {
    const stmt = db.prepare('INSERT INTO callbacks (phone, preferred_time) VALUES (?, ?)');
    const info = stmt.run(phone.trim(), preferred_time.trim());
    return db.prepare('SELECT * FROM callbacks WHERE id = ?').get(info.lastInsertRowid);
  },

  getAllCallbacks() {
    return db.prepare('SELECT * FROM callbacks ORDER BY created_at DESC').all();
  },

  updateCallbackStatus(id, status) {
    db.prepare('UPDATE callbacks SET status = ? WHERE id = ?').run(status, id);
    return db.prepare('SELECT * FROM callbacks WHERE id = ?').get(id);
  },

  // Destinations
  getAllDestinations() {
    return db.prepare('SELECT * FROM destinations ORDER BY id ASC').all();
  },

  // Statistics
  getStats() {
    const totalInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
    const newInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'").get().count;
    const bookedInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'booked'").get().count;
    const totalSubscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get().count;
    const pendingCallbacks = db.prepare("SELECT COUNT(*) as count FROM callbacks WHERE status = 'pending'").get().count;
    const topDest = db.prepare(`
      SELECT destination, COUNT(*) as count
      FROM inquiries
      WHERE destination IS NOT NULL AND destination != ''
      GROUP BY destination
      ORDER BY count DESC
      LIMIT 1
    `).get();

    return {
      totalInquiries,
      newInquiries,
      bookedInquiries,
      totalSubscribers,
      pendingCallbacks,
      topDestination: topDest ? topDest.destination : 'None yet',
      conversionRate: totalInquiries > 0 ? ((bookedInquiries / totalInquiries) * 100).toFixed(1) + '%' : '0%'
    };
  }
};

