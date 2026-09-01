// Automated Full-Stack Integration Test Script for WasteWatch
async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Starting WasteWatch Integration Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
    assert(healthRes.status === 'online', 'Server health endpoint responds online');

    // 2. Demo Login (Citizen)
    const demoCitizen = await fetch(`${BASE_URL}/auth/demo-login/citizen`, { method: 'POST' }).then(r => r.json());
    assert(demoCitizen.success && demoCitizen.token && demoCitizen.user.role === 'user', 'Demo login as Citizen');
    const citizenToken = demoCitizen.token;

    // 3. Demo Login (Admin)
    const demoAdmin = await fetch(`${BASE_URL}/auth/demo-login/admin`, { method: 'POST' }).then(r => r.json());
    assert(demoAdmin.success && demoAdmin.token && demoAdmin.user.role === 'admin', 'Demo login as Admin');
    const adminToken = demoAdmin.token;

    // 4. Demo Login (Staff)
    const demoStaff = await fetch(`${BASE_URL}/auth/demo-login/staff`, { method: 'POST' }).then(r => r.json());
    assert(demoStaff.success && demoStaff.token && demoStaff.user.role === 'cleanup_staff', 'Demo login as Staff');
    const staffToken = demoStaff.token;

    // 5. Get Categories
    const catRes = await fetch(`${BASE_URL}/reports/categories`).then(r => r.json());
    assert(catRes.success && catRes.categories.length >= 8, `Categories retrieved (${catRes.categories.length} categories)`);

    // 6. Get Reports Feed & Filters
    const repRes = await fetch(`${BASE_URL}/reports?limit=20`).then(r => r.json());
    assert(repRes.success && repRes.reports.length > 0, `Get reports feed (${repRes.count} reports found)`);

    // 7. Get Single Report by ID
    const singleRep = await fetch(`${BASE_URL}/reports/1`).then(r => r.json());
    assert(singleRep.success && singleRep.report.id === 1 && singleRep.report.status_logs, 'Get single report with logs & comments');

    // 8. Toggle Upvote on Report
    const upvoteRes = await fetch(`${BASE_URL}/reports/1/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` }
    }).then(r => r.json());
    assert(upvoteRes.success && typeof upvoteRes.upvotes_count === 'number', 'Citizen upvote toggle');

    // 9. Add Comment to Report
    const commentRes = await fetch(`${BASE_URL}/reports/1/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ content: 'Integration test automated comment: verified area!' })
    }).then(r => r.json());
    assert(commentRes.success && commentRes.comment.content.includes('Integration test'), 'Add comment to report');

    // 10. Flag Inappropriate Report
    const flagRes = await fetch(`${BASE_URL}/reports/2/flag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ reason: 'Duplicate submission', details: 'Integration test test flag' })
    }).then(r => r.json());
    assert(flagRes.success, 'Flag complaint for municipal moderation');

    // 11. Create New Waste Report
    const newRepRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Chemical Paint Residue near Westside Canal',
        description: 'Several open cans of industrial paint spilled into water drainage basin.',
        category_id: 4,
        severity: 'critical',
        latitude: 40.7580,
        longitude: -73.9855,
        address: '450 Westside Highway, Sector 9',
        area_district: 'Westside Canal District',
        photo_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=800&auto=format&fit=crop&q=80'
      })
    }).then(r => r.json());
    assert(newRepRes.success && newRepRes.reportId, `Create new waste report (ID: ${newRepRes.reportId})`);
    const createdReportId = newRepRes.reportId;

    // 12. Update Report Status & Add Resolution (Admin / Staff)
    const updateStatusRes = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'cleaned',
        notes: 'Sanitation unit vacuumed residue, neutralizer applied.',
        cleaned_photo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
        assigned_to: 3
      })
    }).then(r => r.json());
    assert(updateStatusRes.success, 'Staff update report lifecycle status to Cleaned with photo');

    // 13. Notifications
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    }).then(r => r.json());
    assert(notifRes.success && notifRes.notifications.length > 0, `Citizen received status notifications (${notifRes.notifications.length} alerts)`);

    // 14. Admin Analytics & KPIs
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(analyticsRes.success && analyticsRes.analytics.totalReports > 0 && analyticsRes.analytics.reportsByCategory, 'Admin analytics computation with categories and time trends');

    // 15. Admin User Management
    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(usersRes.success && usersRes.users.length >= 3, `Admin get all users (${usersRes.users.length} users)`);

    // 16. Admin Moderation Queue
    const flagsRes = await fetch(`${BASE_URL}/admin/flags`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(flagsRes.success && flagsRes.flags.length > 0, `Admin moderation queue list (${flagsRes.flags.length} flags)`);

    // 17. Submit Contact Form
    const contactRes = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Johnson',
        email: 'alex@example.com',
        subject: 'Community Cleanup Drive Collaboration',
        message: 'We want to organize a weekend trash pickup drive in Sector 5.'
      })
    }).then(r => r.json());
    assert(contactRes.success, 'Submit contact message');

    console.log(`\n=========================================`);
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`=========================================`);
  } catch (err) {
    console.error('Test Suite Exception:', err);
  }
}

runTests();
