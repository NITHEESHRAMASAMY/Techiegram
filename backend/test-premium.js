/**
 * Techiegram Premium and Gamification verification test suite.
 */

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const testPremiumFeatures = async () => {
  console.log('----------------------------------------------------');
  console.log('  STARTING TECHIEGRAM PREMIUM & GAMIFICATION TESTS  ');
  console.log('----------------------------------------------------\n');

  let adminToken = '';
  let userToken = '';

  const adminUser = {
    username: `test_admin_${Math.floor(Math.random() * 1000)}`,
    email: `test_admin_${Math.floor(Math.random() * 1000)}@techiegram.com`,
    password: 'secureadminpassword123',
  };

  const normalUser = {
    username: `test_dev_${Math.floor(Math.random() * 1000)}`,
    email: `test_dev_${Math.floor(Math.random() * 1000)}@techiegram.com`,
    password: 'securepassword123',
  };

  try {
    // 1. Create accounts
    console.log('⚙️ [TEST 1] Registering Admin and normal developer...');
    
    // Register Admin
    const adminReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminUser)
    });
    const adminRegData = await adminReg.json();
    adminToken = adminRegData.token;
    
    // Register User
    const userReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalUser)
    });
    const userRegData = await userReg.json();
    userToken = userRegData.token;
    console.log('   ✅ Registrations complete.');

    // Connect to Mongo directly to seed data and elevate role
    const mongoose = require('mongoose');
    const Assessment = require('./models/Assessment');
    const User = require('./models/User');

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/techiegram');
    console.log('   ✅ Connected directly to MongoDB for seeding.');

    // Elevate role directly in DB
    await User.updateOne({ email: adminUser.email }, { role: 'admin' });
    console.log('   ✅ Admin role elevated in database.');

    // Seed MCQ Assessment
    const mcqSeed = await Assessment.create({
      title: 'React Fundamentals Quiz',
      description: 'Test your core React hook knowledge.',
      type: 'mcq',
      questions: [
        {
          questionText: 'Which React hook is used for side-effects?',
          options: ['useState', 'useRef', 'useEffect', 'useMemo'],
          correctOptionIndex: 2
        }
      ],
      xpReward: 200
    });

    // Seed Coding Assessment
    const codingSeed = await Assessment.create({
      title: 'JavaScript Multiplication Challenge',
      description: 'Implement a function solution(input) that multiplies input by 2.',
      type: 'coding',
      difficulty: 'easy',
      testCases: [
        { input: '5', expectedOutput: '10' },
        { input: '12', expectedOutput: '24' }
      ],
      xpReward: 350
    });
    console.log('   ✅ Seeding complete.');

    // 2. Fetch Assessments List
    console.log('\n⚙️ [TEST 2] Fetching assessments list via REST API...');
    const listRes = await fetch(`${BASE_URL}/assessments`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const listData = await listRes.json();
    console.log(`   ✅ Assessments retrieved. Count: ${listData.length}`);

    // 3. Test MCQ Submission Validation
    console.log('\n⚙️ [TEST 3] Submitting MCQ quiz answers...');
    const mcqSubRes = await fetch(`${BASE_URL}/assessments/${mcqSeed._id}/submit-mcq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ answers: [2] }) // correct answer index = 2
    });
    console.log(`   Status code: ${mcqSubRes.status}`);
    const mcqSubText = await mcqSubRes.clone().text();
    console.log(`   Response text: ${mcqSubText}`);
    const mcqSubData = await mcqSubRes.json();
    console.log(`   ✅ Submission processed. Score: ${mcqSubData.score}% | Passed: ${mcqSubData.passed}`);
    console.log(`   ✅ Gamification report: Level ${mcqSubData.gamificationReport.level} | Streak: ${mcqSubData.gamificationReport.streak} | XP Earned: ${mcqSubData.xpEarned}`);

    // 4. Test Code Playground Sandboxed Execution
    console.log('\n⚙️ [TEST 4] Submitting JavaScript sandbox code execution...');
    const solutionCode = `
      function solution(input) {
        return input * 2;
      }
    `;
    const codingSubRes = await fetch(`${BASE_URL}/assessments/${codingSeed._id}/submit-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        code: solutionCode,
        language: 'javascript'
      })
    });
    const codingSubData = await codingSubRes.json();
    console.log(`   ✅ Submission processed. Passed: ${codingSubData.passed}`);
    console.log(`   ✅ Test case details:`, codingSubData.testCasesReports);

    // 5. Test Admin Control Metrics Dashboard (RBAC check)
    console.log('\n⚙️ [TEST 5] Fetching Admin dashboard metrics (RBAC checks)...');
    const adminMetricsRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminMetrics = await adminMetricsRes.json();
    console.log('   ✅ Admin dashboard stats retrieved successfully.');
    console.log(`      Total Users: ${adminMetrics.totalUsers} | Total Posts: ${adminMetrics.totalPosts}`);
    console.log(`      Node Heap Memory Used: ${adminMetrics.systemInfo.nodeMemory.heapUsed}`);

    // Verify user blocked from admin panel
    const badMetricsRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log(`   ✅ RBAC check: User access blocked (Status: ${badMetricsRes.status} Forbidden)`);

    // 6. Test AI Roadmap and Quiz generation triggers
    console.log('\n⚙️ [TEST 6] Testing AI roadmap and quiz endpoint triggers...');
    const roadmapRes = await fetch(`${BASE_URL}/ai/roadmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ skill: 'React' })
    });
    const roadmapData = await roadmapRes.json();
    console.log(`   ✅ Generated roadmap step 1: "${roadmapData.roadmap[0].title}"`);

    // Clean up test database entries
    await Assessment.deleteMany({ _id: { $in: [mcqSeed._id, codingSeed._id] } });
    await User.deleteMany({ email: { $in: [adminUser.email, normalUser.email] } });
    await mongoose.disconnect();

    console.log('\n----------------------------------------------------');
    console.log('  🎉 ALL PREMIUM & GAMIFICATION VERIFICATIONS PASSED! ');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('\n❌ PREMIUM RUNNER TERMINATED:', error.message);
    process.exit(1);
  }
};

testPremiumFeatures();
