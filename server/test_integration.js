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

    // 2. Login as Admin Faiyaz
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faiyaz@gmail.com', password: '7799fftt' })
    }).then(r => r.json());
    assert(adminLoginRes.success && adminLoginRes.user.role === 'admin', 'Login as Admin Faiyaz (faiyaz@gmail.com)');
    const adminToken = adminLoginRes.token;

    // 5. Test Staff Registration Requires Admin Approval
    const testStaffEmail = `pending_staff_${Date.now()}@example.com`;
    const regStaffRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Mendez',
        email: testStaffEmail,
        password: 'Password123!',
        role: 'cleanup_staff'
      })
    }).then(r => r.json());
    assert(regStaffRes.success && regStaffRes.pending_approval === true, 'Registration as Cleanup Staff requires admin approval (status = pending_approval)');
    const pendingStaffId = regStaffRes.user.id;

    // 6. Attempt Login with Unapproved Staff Account (Must be blocked)
    const unapprovedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStaffEmail,
        password: 'Password123!'
      })
    }).then(r => r.json());
    assert(!unapprovedLoginRes.success && unapprovedLoginRes.pending_approval === true, 'Unapproved staff blocked from logging in with supervisor approval message');

    // 7. Admin Approves Pending Staff Account
    const approveRes = await fetch(`${BASE_URL}/admin/users/${pendingStaffId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(approveRes.success, 'Admin approved pending staff account');

    // 8. Approved Staff Can Now Successfully Log In
    const approvedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStaffEmail,
        password: 'Password123!'
      })
    }).then(r => r.json());
    assert(approvedLoginRes.success && approvedLoginRes.token && approvedLoginRes.user.role === 'cleanup_staff', 'Approved staff successfully logged in');
    const staffToken = approvedLoginRes.token;
    const staffId = approvedLoginRes.user.id;

    // Register a citizen user for report creation & flagging
    const citizenEmail = `citizen_${Date.now()}@example.com`;
    const regCitizenRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Citizen', email: citizenEmail, password: 'Password123!', role: 'user' })
    }).then(r => r.json());
    assert(regCitizenRes.success && regCitizenRes.token, 'Registered test citizen user');
    const citizenToken = regCitizenRes.token;

    // Create a new report by Citizen
    const createRepRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Integration Test Garbage Waste Dump',
        description: 'Test waste dump for staff permissions validation',
        category_id: 1,
        severity: 'high',
        latitude: 23.8103,
        longitude: 90.4125,
        address: 'Downtown Main Street',
        primary_photo: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80'
      })
    }).then(r => r.json());
    const createdReportId = createRepRes.reportId || createRepRes.report?.id;
    assert(createRepRes.success && createdReportId, 'Citizen created new report');

    // 9. Staff can View Details of ANY Report (e.g. unassigned or assigned to someone else)
    const singleRep = await fetch(`${BASE_URL}/reports/${createdReportId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    }).then(r => r.json());
    assert(singleRep.success && singleRep.report.id === createdReportId && singleRep.report.title, 'Staff can view full details of any report');

    // 10. Admin Assign Staff to Report (Assign report to new Staff ID)
    const assignRes = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'assigned',
        assigned_to: staffId,
        notes: 'Assigned to newly approved staff.'
      })
    }).then(r => r.json());
    assert(assignRes.success, 'Admin assigned report to approved staff');

    // 11. Staff Update Assigned Report (Allowed, and assignment is preserved)
    const staffUpdateRes = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'in_progress',
        notes: 'Rapid response crew arrived on scene with collection truck.'
      })
    }).then(r => r.json());
    assert(staffUpdateRes.success, 'Assigned staff successfully updated report status to In Progress');

    // 12. Staff Attempt Update on Report NOT Assigned to Them (unassigned report #999) -> Blocked 403
    const forbiddenUpdateRes = await fetch(`${BASE_URL}/reports/${createdReportId + 100}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'cleaned',
        notes: 'Unassigned update attempt'
      })
    }).then(r => r.json());
    assert(!forbiddenUpdateRes.success, 'Staff blocked from updating report not assigned to them');

    // 13. Citizen Flags Inappropriate Report
    const flagRes = await fetch(`${BASE_URL}/reports/${createdReportId}/flag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ reason: 'Duplicate / Spam', details: 'Integration test automated flag submission' })
    }).then(r => r.json());
    assert(flagRes.success, 'Citizen submitted report moderation flag');

    // 14. Admin Moderation Queue
    const flagsQueueRes = await fetch(`${BASE_URL}/admin/flags`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(flagsQueueRes.success && Array.isArray(flagsQueueRes.flags), 'Admin fetched moderation flags queue');

    // 15. Admin Staff Roster Workload Stats
    const staffRosterRes = await fetch(`${BASE_URL}/admin/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(
      staffRosterRes.success &&
      Array.isArray(staffRosterRes.staff) &&
      staffRosterRes.staff.length >= 1,
      'Admin get staff roster with assigned workload statistics'
    );

    // 16. Admin Suspend (Ban) User Account
    const banRes = await fetch(`${BASE_URL}/admin/users/${staffId}/ban`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(banRes.success && banRes.status === 'banned', 'Admin suspended (banned) user account');

    // 17. Admin Permanently Delete User Account
    const deleteRes = await fetch(`${BASE_URL}/admin/users/${staffId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(deleteRes.success, 'Admin permanently deleted staff/client account ID');

    console.log(`\n=========================================`);
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`=========================================`);
  } catch (err) {
    console.error('Test Suite Exception:', err);
  }
}

runTests();
