const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedDatabase() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  const categories = [
    { id: 1, name: 'Household Waste', slug: 'household-waste', description: 'Domestic trash, organic waste, kitchen leftovers & bags', icon: 'Trash2', color: '#10B981' },
    { id: 2, name: 'Plastic & Packaging', slug: 'plastic', description: 'Bottles, single-use bags, packaging materials, styrofoam', icon: 'ShoppingBag', color: '#3B82F6' },
    { id: 3, name: 'Construction Debris', slug: 'construction-waste', description: 'Bricks, concrete rubble, wood tiles, drywall remnants', icon: 'HardHat', color: '#F59E0B' },
    { id: 4, name: 'Industrial Waste', slug: 'industrial-waste', description: 'Chemical drums, metal scraps, rubber tires, toxic containers', icon: 'Factory', color: '#EF4444' },
    { id: 5, name: 'Drain & Sewer Waste', slug: 'drain-sewer', description: 'Clogged storm drains, overflowing sewers, grease runoff', icon: 'Droplets', color: '#8B5CF6' },
    { id: 6, name: 'Roadside Garbage', slug: 'roadside-garbage', description: 'Littered sidewalks, median dumpings, highway roadside piles', icon: 'AlertTriangle', color: '#EC4899' },
    { id: 7, name: 'Water Pollution', slug: 'water-pollution', description: 'Contaminated lakes, floating river trash, coastal canal plastics', icon: 'Waves', color: '#06B6D4' },
    { id: 8, name: 'Other Hazardous Waste', slug: 'other', description: 'Electronic waste, broken glass, batteries, medical materials', icon: 'HelpCircle', color: '#6B7280' }
  ];

  const users = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      email: 'citizen@wastewatch.org',
      password_hash: passwordHash,
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      bio: 'Eco-conscious citizen passionate about zero-waste neighborhoods and clean public parks.',
      phone: '+1 (555) 234-5678',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 2,
      name: 'Marcus Vance',
      email: 'admin@wastewatch.org',
      password_hash: adminHash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Chief Municipal Sanitation Supervisor & Environmental Operations Director.',
      phone: '+1 (555) 876-5432',
      status: 'active',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: 3,
      name: 'Alex Rivera',
      email: 'staff@wastewatch.org',
      password_hash: staffHash,
      role: 'cleanup_staff',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Senior Rapid Response Sanitation Officer - Sector 4 Heavy Duty Cleaning Unit.',
      phone: '+1 (555) 432-1098',
      status: 'active',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 4,
      name: 'David Chen',
      email: 'david@example.com',
      password_hash: passwordHash,
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      bio: 'Urban photographer and green trail volunteer.',
      phone: '+1 (555) 901-2345',
      status: 'active',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 5,
      name: 'Elena Rostova',
      email: 'elena@example.com',
      password_hash: passwordHash,
      role: 'cleanup_staff',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      bio: 'Municipal Waste Operations Specialist - River & Waterways Division.',
      phone: '+1 (555) 345-6789',
      status: 'active',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString()
    }
  ];

  const reports = [
    {
      id: 1,
      user_id: 1,
      title: 'Massive Plastic Dumping Along Pinecrest Riverbank',
      description: 'Over 200kg of discarded single-use plastic bottles, styrofoam food containers, and broken milk crates accumulated near the river curve, blocking rainwater discharge.',
      category_id: 2,
      severity: 'critical',
      status: 'cleaned',
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'Pinecrest Waterfront Trail, Pier 14, River District',
      area_district: 'River District',
      primary_photo: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      assigned_to: 3,
      verified_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      cleaned_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      closed_at: null,
      views_count: 342,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 2,
      user_id: 4,
      title: 'Clogged Storm Drain with Overflowing Sewage on 5th Ave',
      description: 'Heavy blockage in municipal drainage grate creating foul water pooling across the pedestrian crosswalk and bicycle lane.',
      category_id: 5,
      severity: 'high',
      status: 'in_progress',
      latitude: 40.7306,
      longitude: -73.9352,
      address: 'Corner of 5th Ave & Elm St, Midtown Hub',
      area_district: 'Midtown',
      primary_photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: null,
      assigned_to: 3,
      verified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      cleaned_at: null,
      closed_at: null,
      views_count: 189,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 3,
      user_id: 1,
      title: 'Illegal Demolition Rubble Dumped near Community School',
      description: 'Broken concrete slabs, exposed reinforcement rebar, plaster boards, and tile shards dumped beside the Oakridge Elementary playground fence.',
      category_id: 3,
      severity: 'high',
      status: 'assigned',
      latitude: 40.7589,
      longitude: -73.9851,
      address: '742 Oakridge Ave, North Valley Suburb',
      area_district: 'North Valley',
      primary_photo: 'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: null,
      assigned_to: 5,
      verified_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      cleaned_at: null,
      closed_at: null,
      views_count: 145,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 4,
      user_id: 4,
      title: 'Overflowing Household Bins and Debris at Market Alley',
      description: 'Commercial and residential garbage bins overflowing onto the sidewalk, creating pest attraction and blocking storefront access.',
      category_id: 1,
      severity: 'medium',
      status: 'verified',
      latitude: 40.7180,
      longitude: -73.9980,
      address: 'Market Square Alley #4, Downtown',
      area_district: 'Downtown',
      primary_photo: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: null,
      assigned_to: null,
      verified_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      cleaned_at: null,
      closed_at: null,
      views_count: 98,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600000).toISOString()
    },
    {
      id: 5,
      user_id: 1,
      title: 'Discarded Chemical Drums near Greenway Industrial Canal',
      description: 'Three unsealed metal drums with rusty corrosion and chemical odor observed near the water runoff edge.',
      category_id: 4,
      severity: 'critical',
      status: 'reported',
      latitude: 40.6782,
      longitude: -74.0445,
      address: 'Greenway Industrial Park, Gate 9, East Harbor',
      area_district: 'East Harbor',
      primary_photo: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: null,
      assigned_to: null,
      verified_at: null,
      cleaned_at: null,
      closed_at: null,
      views_count: 76,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600000).toISOString()
    },
    {
      id: 6,
      user_id: 4,
      title: 'Major Highway Median Trash Accumulation on Highway 101',
      description: 'Blown tires, fast food containers, plastic tarps, and packaging cluttering the center divider along mile marker 14.',
      category_id: 6,
      severity: 'medium',
      status: 'cleaned',
      latitude: 40.7831,
      longitude: -73.9712,
      address: 'State Route 101, Milepost 14 Westbound',
      area_district: 'West Highway Corridor',
      primary_photo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
      assigned_to: 3,
      verified_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      cleaned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      closed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      views_count: 220,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 7,
      user_id: 1,
      title: 'Oil Slick and Plastic Bottles in Lakeview Public Pond',
      description: 'Surface petroleum sheen and dozens of floating plastic soda bottles trapping waterfowl near the observation deck.',
      category_id: 7,
      severity: 'high',
      status: 'in_progress',
      latitude: 40.7484,
      longitude: -73.9857,
      address: 'Lakeview Memorial Park, South Pond Deck',
      area_district: 'Central Parkview',
      primary_photo: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&auto=format&fit=crop&q=80',
      cleaned_photo: null,
      assigned_to: 5,
      verified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      cleaned_at: null,
      closed_at: null,
      views_count: 310,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ];

  const upvotes = [
    { id: 1, report_id: 1, user_id: 1, created_at: new Date().toISOString() },
    { id: 2, report_id: 1, user_id: 2, created_at: new Date().toISOString() },
    { id: 3, report_id: 1, user_id: 4, created_at: new Date().toISOString() },
    { id: 4, report_id: 2, user_id: 1, created_at: new Date().toISOString() },
    { id: 5, report_id: 2, user_id: 4, created_at: new Date().toISOString() },
    { id: 6, report_id: 3, user_id: 4, created_at: new Date().toISOString() },
    { id: 7, report_id: 5, user_id: 1, created_at: new Date().toISOString() },
    { id: 8, report_id: 7, user_id: 1, created_at: new Date().toISOString() },
    { id: 9, report_id: 7, user_id: 4, created_at: new Date().toISOString() }
  ];

  const comments = [
    { id: 1, report_id: 1, user_id: 4, content: 'Thank you for reporting this! Our local walking club was very concerned about the wildlife here.', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 2, report_id: 1, user_id: 3, content: 'Team Rivera deployed heavy trash vacuum and bagged 18 sacks of plastic. All clear!', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 3, report_id: 2, user_id: 1, content: 'The water was reaching knee height during yesterday rain. Thanks for prioritizing!', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 4, report_id: 3, user_id: 2, content: 'Demolition permit verified. Contractor has been issued a municipal citation and scheduled for cleanup.', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 5, report_id: 7, user_id: 5, content: 'Skimmer boats are currently deployed to remove surface slick and floating debris.', created_at: new Date(Date.now() - 12 * 3600000).toISOString() }
  ];

  const statusLogs = [
    { id: 1, report_id: 1, changed_by_user_id: 1, from_status: null, to_status: 'reported', notes: 'Initial report submitted by citizen.', photo_url: null, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 2, report_id: 1, changed_by_user_id: 2, from_status: 'reported', to_status: 'verified', notes: 'Inspection confirmed hazardous plastic accumulation.', photo_url: null, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 3, report_id: 1, changed_by_user_id: 2, from_status: 'verified', to_status: 'assigned', notes: 'Assigned to Alex Rivera Rapid Response Team.', photo_url: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 4, report_id: 1, changed_by_user_id: 3, from_status: 'assigned', to_status: 'in_progress', notes: 'Sanitation crew and waste containment boat on site.', photo_url: null, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 5, report_id: 1, changed_by_user_id: 3, from_status: 'in_progress', to_status: 'cleaned', notes: 'All waste removed, recycled and riverfront restored.', photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },

    { id: 6, report_id: 2, changed_by_user_id: 4, from_status: null, to_status: 'reported', notes: 'Initial citizen complaint filed.', photo_url: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 7, report_id: 2, changed_by_user_id: 2, from_status: 'reported', to_status: 'verified', notes: 'Sanitation officer confirmed drain blockage.', photo_url: null, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 8, report_id: 2, changed_by_user_id: 3, from_status: 'verified', to_status: 'in_progress', notes: 'Hydro-jetting unit actively clearing storm line.', photo_url: null, created_at: new Date(Date.now() - 1 * 86400000).toISOString() }
  ];

  const notifications = [
    { id: 1, user_id: 1, title: 'Report Cleaned! 🎉', message: 'Your report "Massive Plastic Dumping Along Pinecrest Riverbank" has been cleaned and verified.', type: 'status_change', link_url: '/reports/1', is_read: false, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 2, user_id: 1, title: 'Report Verified', message: 'Municipal supervisor has verified your report on Pinecrest Riverbank.', type: 'verification', link_url: '/reports/1', is_read: true, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 3, user_id: 4, title: 'Cleanup In Progress 🚜', message: 'Sanitation team is currently clearing the drain blockage on 5th Ave.', type: 'status_change', link_url: '/reports/2', is_read: false, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 4, user_id: 1, title: 'New Upvote Received', message: 'A citizen upvoted your waste report on Pinecrest Riverbank.', type: 'upvote', link_url: '/reports/1', is_read: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  // Seed MySQL if active
  if (db.isMysqlActive) {
    try {
      const [existingUsers] = await db.query('SELECT COUNT(*) as count FROM users');
      if (existingUsers && existingUsers[0].count === 0) {
        console.log('[Seed] Populating MySQL tables with initial dataset...');
        for (const u of users) {
          await db.query(
            'INSERT INTO users (id, name, email, password_hash, role, avatar, bio, phone, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.email, u.password_hash, u.role, u.avatar, u.bio, u.phone, u.status, u.created_at]
          );
        }
        for (const c of categories) {
          await db.query(
            'INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
            [c.id, c.name, c.slug, c.description, c.icon, c.color]
          );
        }
        for (const r of reports) {
          await db.query(
            `INSERT INTO reports (id, user_id, title, description, category_id, severity, status, latitude, longitude, address, area_district, primary_photo, cleaned_photo, assigned_to, verified_at, cleaned_at, closed_at, views_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.id, r.user_id, r.title, r.description, r.category_id, r.severity, r.status, r.latitude, r.longitude, r.address, r.area_district, r.primary_photo, r.cleaned_photo, r.assigned_to, r.verified_at, r.cleaned_at, r.closed_at, r.views_count, r.created_at, r.updated_at]
          );
        }
        for (const u of upvotes) {
          await db.query('INSERT INTO upvotes (id, report_id, user_id, created_at) VALUES (?, ?, ?, ?)', [u.id, u.report_id, u.user_id, u.created_at]);
        }
        for (const c of comments) {
          await db.query('INSERT INTO comments (id, report_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)', [c.id, c.report_id, c.user_id, c.content, c.created_at]);
        }
        for (const l of statusLogs) {
          await db.query('INSERT INTO report_status_logs (id, report_id, changed_by_user_id, from_status, to_status, notes, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [l.id, l.report_id, l.changed_by_user_id, l.from_status, l.to_status, l.notes, l.photo_url, l.created_at]);
        }
        for (const n of notifications) {
          await db.query('INSERT INTO notifications (id, user_id, title, message, type, link_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [n.id, n.user_id, n.title, n.message, n.type, n.link_url, n.is_read, n.created_at]);
        }
        console.log('[Seed] MySQL initial seeding complete!');
      }
    } catch (e) {
      console.warn('[Seed] MySQL seed warning:', e.message);
    }
  }

  // Also populate Fallback store if empty
  if (!db.fallbackStore.data.users || db.fallbackStore.data.users.length === 0) {
    db.fallbackStore.data.users = users;
    db.fallbackStore.data.categories = categories;
    db.fallbackStore.data.reports = reports;
    db.fallbackStore.data.upvotes = upvotes;
    db.fallbackStore.data.comments = comments;
    db.fallbackStore.data.report_status_logs = statusLogs;
    db.fallbackStore.data.notifications = notifications;
    db.fallbackStore.data.flags = [];
    db.fallbackStore.data.contact_messages = [];
    db.fallbackStore.save();
    console.log('[Seed] High-Performance local database successfully initialized with rich seed dataset!');
  }
}

module.exports = { seedDatabase };
