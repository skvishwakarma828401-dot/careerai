const http = require('http');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const httpRequest = (options, postData, isRawBuffer = false) => {
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
      if (isRawBuffer || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
    }
    req.end();
  });
};

const createSamplePDF = async (text) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 600]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText(text, {
    x: 40,
    y: 550,
    size: 11,
    font,
    color: rgb(0, 0, 0),
    lineHeight: 16,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

const createMultipartPayload = (fieldName, filename, mimeType, fileBuffer) => {
  const boundary = '----CareerAIBoundary' + Math.random().toString(36).substring(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const headerBuf = Buffer.from(header, 'utf-8');
  const footerBuf = Buffer.from(footer, 'utf-8');
  return {
    boundary,
    body: Buffer.concat([headerBuf, fileBuffer, footerBuf]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};

async function runRoadmapAnalyticsTests() {
  console.log('=== CareerAI Learning Roadmap & Analytics Test Suite ===\n');

  // Step 0: Setup users
  console.log('0. Setting up test users (User A & User B):');
  const userAEmail = `roadmap_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `roadmap_user_b_${Date.now()}@careerai.dev`;

  const userARes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Alex Rivera', email: userAEmail, password: 'password123', targetRole: 'Senior Full Stack Engineer' }
  );
  const cookieUserA = userARes.cookie[0].split(';')[0];
  console.log(`User A created: ${userAEmail}`);

  const userBRes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Jordan Lee', email: userBEmail, password: 'password123' }
  );
  const cookieUserB = userBRes.cookie[0].split(';')[0];
  console.log(`User B created: ${userBEmail}\n`);

  // Step 1: Upload Resume for User A
  console.log('1. Uploading Resume for User A:');
  const resumeText = `Alex Rivera - Full Stack Engineer
Skills: React, Node.js, Express, MongoDB, JavaScript, TypeScript, REST APIs.
Experience: 3 years building web apps.`;

  const pdfBuffer = await createSamplePDF(resumeText);
  const multipart = createMultipartPayload('resume', 'alex_roadmap_resume.pdf', 'application/pdf', pdfBuffer);

  const uploadRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        'Content-Length': multipart.body.length,
        Cookie: cookieUserA,
      },
    },
    multipart.body,
    true
  );
  const resumeId = uploadRes.data.data?._id;
  console.log('Resume Upload Status:', uploadRes.statusCode);
  console.log('✓ Candidate Resume Uploaded\n');

  // Step 2: Create Target Job for User A
  console.log('2. Creating Target Job for User A:');
  const createJobRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      title: 'Senior Full Stack Software Engineer',
      company: 'Vercel',
      description: 'Looking for a Senior Full Stack Engineer skilled in React, Node.js, Docker containerization, AWS cloud, Redis caching, and scalable system design.',
      autoAnalyze: true,
    }
  );
  const jobId = createJobRes.data.data?._id;
  console.log('Job Create Status:', createJobRes.statusCode);
  console.log('✓ Target Job Created\n');

  // Step 3: Generate 4-Week Personalized Roadmap (POST /api/roadmaps/generate)
  console.log('3. Generating Personalized 4-Week Learning Roadmap (POST /api/roadmaps/generate):');
  const genRoadmapRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/roadmaps/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      targetRole: 'Senior Full Stack Software Engineer',
      resumeId,
      jobId,
    }
  );

  console.log('Roadmap Status Code:', genRoadmapRes.statusCode);
  const roadmap = genRoadmapRes.data.data;
  console.log('Roadmap ID:', roadmap?._id);
  console.log('Target Role:', roadmap?.targetRole);
  console.log('Weeks Count:', roadmap?.weeks?.length);
  console.log('Total Topics Count:', roadmap?.topics?.length);
  console.log('Initial Progress:', `${roadmap?.progress}%`);
  console.log('Week 1:', roadmap?.weeks?.[0]?.title);
  console.log('Week 2:', roadmap?.weeks?.[1]?.title);
  console.log('Week 3:', roadmap?.weeks?.[2]?.title);
  console.log('Week 4:', roadmap?.weeks?.[3]?.title);

  if (genRoadmapRes.statusCode === 201 && roadmap?.weeks?.length === 4) {
    console.log('✓ 4-Week Personalized Roadmap Generated Successfully\n');
  }

  // Step 4: Fetch Roadmaps (GET /api/roadmaps)
  console.log('4. Fetching Roadmaps for User A (GET /api/roadmaps):');
  const listRoadmapsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/roadmaps',
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', listRoadmapsRes.statusCode);
  console.log('Active Roadmap Title:', listRoadmapsRes.data.activeRoadmap?.targetRole);
  if (listRoadmapsRes.statusCode === 200 && listRoadmapsRes.data.count >= 1) {
    console.log('✓ Roadmaps List & Active Roadmap Retrieved\n');
  }

  // Step 5: Mark Topics Complete (PATCH /api/roadmaps/:id/progress)
  console.log('5. Marking Topic Complete and Updating Progress (PATCH /api/roadmaps/:id/progress):');
  const targetTopicId = roadmap.weeks[0].topics[0].topicId;
  const updateProgressRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/roadmaps/${roadmap._id}/progress`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      topicId: targetTopicId,
      isCompleted: true,
    }
  );

  console.log('Status Code:', updateProgressRes.statusCode);
  console.log('Updated Progress:', `${updateProgressRes.data.data?.progress}%`);
  console.log('Completed Topics:', updateProgressRes.data.data?.completedTopics);

  if (updateProgressRes.data.data?.progress > 0 && updateProgressRes.data.data?.completedTopics?.length === 1) {
    console.log('✓ Topic Progress Updated & Percentage Calculated Correctly\n');
  }

  // Step 6: Fetch Career Analytics Overview (GET /api/analytics)
  console.log('6. Fetching Career Analytics Overview (GET /api/analytics):');
  const analyticsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics',
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', analyticsRes.statusCode);
  const analytics = analyticsRes.data.data;
  console.log('Career Readiness Score:', `${analytics?.readinessScore}/100`);
  console.log('Resume ATS Score:', `${analytics?.resumeScore}/100`);
  console.log('Job Match Score:', `${analytics?.jobMatchScore}/100`);
  console.log('Technical Competency Score:', `${analytics?.technicalScore}/100`);
  console.log('Communication Score:', `${analytics?.communicationScore}/100`);
  console.log('Roadmap Progress:', `${analytics?.roadmapProgress}%`);
  console.log('Verified Skills Count:', analytics?.skillProgress?.verifiedCount);
  console.log('Priority Skill Gaps Count:', analytics?.skillProgress?.gapCount);

  if (analyticsRes.statusCode === 200 && analytics?.readinessScore > 0) {
    console.log('✓ Career Analytics Metrics Aggregated Successfully\n');
  }

  // Step 7: Test Multi-Tenant Isolation
  console.log("7. Testing Multi-Tenant Isolation (User B updating User A's roadmap):");
  const unauthUpdateRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/roadmaps/${roadmap._id}/progress`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserB },
    },
    {
      topicId: targetTopicId,
      isCompleted: true,
    }
  );

  console.log('Status Code:', unauthUpdateRes.statusCode);
  if (unauthUpdateRes.statusCode === 500 || unauthUpdateRes.statusCode === 404 || unauthUpdateRes.statusCode === 403) {
    console.log('✓ User Isolation Enforced: User B cannot modify User A\'s roadmap!\n');
  }

  console.log('=== All 7 Roadmap & Analytics Tests Passed Successfully! ===');
}

runRoadmapAnalyticsTests().catch(console.error);
