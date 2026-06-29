const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const testRunner = async () => {
  console.log('-------------------------------------------');
  console.log('  STARTING TECHIEGRAM BACKEND API VERIFIER ');
  console.log('-------------------------------------------\n');

  let token = '';
  const testUser = {
    username: `test_dev_${Math.floor(Math.random() * 1000)}`,
    email: `test_dev_${Math.floor(Math.random() * 1000)}@techiegram.com`,
    password: 'securepassword123',
  };

  try {
    // 1. Verify Welcome Endpoint
    console.log('⚙️ [TEST 1] Verifying server status...');
    const welcomeRes = await fetch(`http://localhost:${PORT}/`);
    const welcomeData = await welcomeRes.json();
    console.log(`   Response: "${welcomeData.message}"`);
    if (welcomeRes.status === 200) {
      console.log('   ✅ Welcome route active.');
    } else {
      throw new Error('Server main entry point returned non-200 status');
    }

    // 2. Register Test User
    console.log('\n⚙️ [TEST 2] Registering temporary test account...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    if (regRes.status === 201) {
      console.log(`   ✅ Account created successfully: "${regData.username}"`);
      token = regData.token;
    } else {
      throw new Error(`Registration failed: ${regData.message}`);
    }

    // 3. Authenticate / Login User
    console.log('\n⚙️ [TEST 3] Authenticating user credentials...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200) {
      console.log('   ✅ Auth credentials verified. Token retrieved.');
    } else {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    // 4. Retrieve Profile Details (Protected)
    console.log('\n⚙️ [TEST 4] Retrieving protected user profile...');
    const profileRes = await fetch(`${BASE_URL}/users/profile/${testUser.username}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const profileData = await profileRes.json();
    if (profileRes.status === 200) {
      console.log(`   ✅ Profile fetched. Followers: ${profileData.followersCount}, Skills: [${profileData.skills.join(', ')}]`);
    } else {
      throw new Error(`Profile fetch failed: ${profileData.message}`);
    }

    // 5. Execute Global Search (Protected)
    console.log('\n⚙️ [TEST 5] Testing Search index queries...');
    const searchRes = await fetch(`${BASE_URL}/search?q=${testUser.username}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const searchData = await searchRes.json();
    if (searchRes.status === 200) {
      console.log(`   ✅ Query matching user: ${searchData.users?.length} match(es) found.`);
    } else {
      throw new Error(`Search failed: ${searchData.message}`);
    }

    console.log('\n-------------------------------------------');
    console.log('  🎉 ALL BACKEND API VERIFICATIONS PASSED! ');
    console.log('-------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ TEST RUNNER TERMINATED: ${error.message}`);
    process.exit(1);
  }
};

// Wait 2 seconds to make sure server initialized
setTimeout(testRunner, 2000);
