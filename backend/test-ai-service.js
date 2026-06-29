/**
 * Techiegram AI Microservice Test Script
 * Verifies comment toxicity and recommendation engines.
 */

const testAIService = async () => {
  const serviceUrl = 'http://localhost:8000';
  console.log(`Pinging AI Microservice at: ${serviceUrl}...`);

  try {
    const ping = await fetch(serviceUrl);
    const pingData = await ping.json();
    console.log('✔ Service Status:', pingData.message);
  } catch (err) {
    console.error('❌ Service Connection Failed. Please ensure FastAPI is running on port 8000.\n', err.message);
    process.exit(1);
  }

  // 1. Comment Toxicity Moderation Test
  console.log('\n--- 1. Testing Comment Toxicity ---');
  const samples = [
    { text: 'This is an awesome code snippet, thank you!', expectedToxic: false },
    { text: 'You are an idiot and this setup is complete trash.', expectedToxic: true }
  ];

  for (const sample of samples) {
    try {
      const response = await fetch(`${serviceUrl}/moderation/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: sample.text })
      });
      const result = await response.json();
      console.log(`Comment: "${sample.text}"`);
      console.log(`-> Toxicity Score: ${result.toxicity_score.toFixed(3)} | Is Toxic: ${result.is_toxic}`);
      if (result.is_toxic === sample.expectedToxic) {
        console.log('✔ Test Passed');
      } else {
        console.log('❌ Test Failed');
      }
    } catch (err) {
      console.error('Toxicity test error:', err.message);
    }
  }

  // 2. Recommendations Engine Test
  console.log('\n--- 2. Testing Recommendations Engine ---');
  const mockPayload = {
    userId: 'user1',
    limit: 5,
    users: [
      { _id: 'user1', username: 'dan', skills: ['react', 'javascript'] },
      { _id: 'user2', username: 'linus', skills: ['c', 'git'] },
      { _id: 'user3', username: 'guido', skills: ['python'] }
    ],
    posts: [
      { _id: 'post1', hashtags: ['react', 'hooks'], user: 'user1' },
      { _id: 'post2', hashtags: ['python', 'django'], user: 'user3' },
      { _id: 'post3', hashtags: ['c', 'pointers'], user: 'user2' },
      { _id: 'post4', hashtags: ['react', 'nextjs'], user: 'user1' },
      { _id: 'post5', hashtags: ['git', 'branches'], user: 'user2' }
    ],
    interactions: [
      // user1 likes post4
      { user: 'user1', post: 'post4', type: 'like' },
      // user2 likes post3 and post5
      { user: 'user2', post: 'post3', type: 'like' },
      { user: 'user2', post: 'post5', type: 'like' },
      // user3 likes post2
      { user: 'user3', post: 'post2', type: 'like' },
      // user1 also likes post1
      { user: 'user1', post: 'post1', type: 'like' }
    ]
  };

  try {
    const response = await fetch(`${serviceUrl}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPayload)
    });
    const result = await response.json();
    console.log('✔ Recommendations Output:', result.recommended_ids);
    if (Array.isArray(result.recommended_ids)) {
      console.log('✔ Recommendation Test Passed');
    } else {
      console.log('❌ Recommendation Test Failed');
    }
  } catch (err) {
    console.error('Recommendation test error:', err.message);
  }
};

testAIService();
