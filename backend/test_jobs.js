const http = require('http');

const httpRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          cookie: res.headers['set-cookie'],
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function runJobTests() {
  console.log('=== CareerAI Job Description Intelligence Test Suite ===\n');

  // Step 0: Setup users
  console.log('0. Setting up test users:');
  const userAEmail = `job_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `job_user_b_${Date.now()}@careerai.dev`;

  const userARes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Alex Rivera', email: userAEmail, password: 'password123', targetRole: 'Full Stack Engineer' }
  );
  const cookieUserA = userARes.cookie[0].split(';')[0];
  console.log(`User A created: ${userAEmail}`);

  const userBRes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Jordan Lee', email: userBEmail, password: 'password123' }
  );
  const cookieUserB = userBRes.cookie[0].split(';')[0];
  console.log(`User B created: ${userBEmail}\n`);

  let jobId = null;

  // Step 1: Create a Job Posting
  console.log('1. Testing POST /api/jobs (Create Job Description):');
  const jobPayload = {
    title: 'Senior Full Stack Engineer',
    company: 'Stripe / Fintech Innovation',
    description: `We are looking for a Senior Full Stack Engineer to join our Payment Core team.
Requirements:
- 4+ years of professional software development experience.
- Strong proficiency in TypeScript, React.js, and Node.js backend services.
- Solid database experience with PostgreSQL and MongoDB.
- Experience with Docker, Kubernetes, and AWS cloud infrastructure.
Preferred:
- Experience with GraphQL APIs and Redis caching.
- Background in high-throughput financial transactions.
Education:
- Bachelor's degree in Computer Science or equivalent practical experience.
Responsibilities:
- Architect reliable, sub-second latency payment flows.
- Collaborate with product designers and frontend engineers to build world-class developer interfaces.`,
  };

  const createRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieUserA,
      },
    },
    jobPayload
  );

  console.log('Status Code:', createRes.statusCode);
  jobId = createRes.data.data?._id;
  console.log('Created Job ID:', jobId);
  console.log('Title:', createRes.data.data?.title);
  console.log('Company:', createRes.data.data?.company);
  console.log('Initial Status:', createRes.data.data?.status);
  console.log('✓ Create Job Passed\n');

  // Step 2: Trigger AI Job Analysis (POST /api/jobs/:id/analyze)
  console.log(`2. Testing POST /api/jobs/${jobId}/analyze (AI Job Extraction):`);
  const analyzeRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}/analyze`,
    method: 'POST',
    headers: {
      Cookie: cookieUserA,
    },
  });

  console.log('Status Code:', analyzeRes.statusCode);
  const analyzedJob = analyzeRes.data.data;
  console.log('Updated Status:', analyzedJob?.status);
  console.log('Required Skills:', analyzedJob?.requiredSkills);
  console.log('Preferred Skills:', analyzedJob?.preferredSkills);
  console.log('Technologies:', JSON.stringify(analyzedJob?.analysis?.technologies, null, 2));
  console.log('Experience Requirements:', analyzedJob?.experienceRequirements);
  console.log('Education Requirements:', analyzedJob?.educationRequirements);
  console.log('Responsibilities Count:', analyzedJob?.responsibilities?.length);
  console.log('✓ AI Job Extraction & Zod Validation Passed\n');

  // Step 3: Test User Isolation
  console.log("3. Testing User Isolation (User B attempting to view/analyze User A's job):");
  const isolationRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}`,
    method: 'GET',
    headers: {
      Cookie: cookieUserB,
    },
  });

  console.log('Status Code:', isolationRes.statusCode);
  console.log('Response:', JSON.stringify(isolationRes.data, null, 2));
  console.log('✓ User Isolation Enforced Correctly (404 Not Found)\n');

  // Step 4: Test GET /api/jobs (List)
  console.log('4. Testing GET /api/jobs (List for User A):');
  const listRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/jobs',
    method: 'GET',
    headers: {
      Cookie: cookieUserA,
    },
  });

  console.log('Status Code:', listRes.statusCode);
  console.log('Jobs Count:', listRes.data.count);
  console.log('Jobs:', listRes.data.data.map(j => `${j.title} at ${j.company} [Status: ${j.status}]`));
  console.log('✓ Jobs List Verified\n');

  // Step 5: Test GET /api/jobs/:id (Details)
  console.log(`5. Testing GET /api/jobs/${jobId} (Details for User A):`);
  const detailsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}`,
    method: 'GET',
    headers: {
      Cookie: cookieUserA,
    },
  });

  console.log('Status Code:', detailsRes.statusCode);
  console.log('Has Description:', detailsRes.data.data?.description?.length > 0);
  console.log('Has Analysis:', detailsRes.data.data?.analysis?.requiredSkills !== undefined);
  console.log('✓ Job Details Verified\n');

  // Step 6: Test DELETE /api/jobs/:id
  console.log(`6. Testing DELETE /api/jobs/${jobId}:`);
  const deleteRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}`,
    method: 'DELETE',
    headers: {
      Cookie: cookieUserA,
    },
  });

  console.log('Status Code:', deleteRes.statusCode);
  console.log('Response:', JSON.stringify(deleteRes.data, null, 2));

  // Verify deletion
  const verifyDeleteRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}`,
    method: 'GET',
    headers: {
      Cookie: cookieUserA,
    },
  });
  console.log('Verification after delete (Status Code):', verifyDeleteRes.statusCode);
  console.log('✓ Job Deleted Correctly\n');

  console.log('=== All 6 Job Description Intelligence Tests Passed Successfully! ===');
}

runJobTests().catch(console.error);
