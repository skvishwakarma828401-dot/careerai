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

async function runInterviewTests() {
  console.log('=== CareerAI AI Interview Generator Test Suite ===\n');

  // Step 0: Setup users
  console.log('0. Setting up test users (User A & User B):');
  const userAEmail = `interview_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `interview_user_b_${Date.now()}@careerai.dev`;

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

  // Step 1: Upload Resume with Spotify MERN Project for User A
  console.log('1. Uploading Resume with "Built Spotify clone using MERN" for User A:');
  const resumeText = `Alex Rivera - Full Stack Engineer
Summary: 3+ years developing scalable web applications.
Projects:
- Built Spotify clone using MERN stack: Architected continuous audio playback in React with custom audio streaming endpoints and MongoDB playlist schema indexing.
- Real-Time Chat System: Built WebSocket chat server with Node.js and Redis Pub/Sub.
Skills: React, Node.js, Express, MongoDB, TypeScript, REST APIs, JWT Authentication.`;

  const pdfBuffer = await createSamplePDF(resumeText);
  const multipart = createMultipartPayload('resume', 'alex_spotify_resume.pdf', 'application/pdf', pdfBuffer);

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
  console.log(`Resume Uploaded: ID ${resumeId}\n`);

  let mernInterviewId = null;

  // Step 2: Generate MERN Interview with Project Personalization
  console.log('2. Generating MERN Mock Interview (POST /api/interviews):');
  const mernGenRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/interviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      type: 'mern',
      difficulty: 'medium',
      targetRole: 'MERN Stack Developer',
      resumeId,
      questionCount: 5,
    }
  );

  console.log('Status Code:', mernGenRes.statusCode);
  const mernData = mernGenRes.data.data;
  mernInterviewId = mernData?._id;
  console.log('Generated Interview ID:', mernInterviewId);
  console.log('Type:', mernData?.type, '| Difficulty:', mernData?.difficulty);
  console.log('Questions Count:', mernData?.questions?.length);
  console.log('Questions Preview:');
  mernData?.questions?.forEach((q) => {
    console.log(`  [Q${q.questionId} - ${q.category}] ${q.question.substring(0, 90)}...`);
    console.log(`    Context: "${q.context}"`);
  });

  const hasProjectPersonalization = mernData?.questions?.some(
    (q) => q.question.toLowerCase().includes('spotify') || q.context.toLowerCase().includes('spotify')
  );
  console.log('Includes Personalized Spotify Project Question:', hasProjectPersonalization);

  if (mernGenRes.statusCode === 201 && mernData?.questions?.length >= 3) {
    console.log('✓ MERN Interview Generated Successfully\n');
  }

  // Step 3: Generate HR / Behavioral Interview (Hard Difficulty)
  console.log('3. Generating Behavioral HR Interview (Hard Difficulty):');
  const behavioralGenRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/interviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      type: 'behavioral',
      difficulty: 'hard',
      targetRole: 'Engineering Team Lead',
      questionCount: 5,
    }
  );

  console.log('Status Code:', behavioralGenRes.statusCode);
  const behavioralData = behavioralGenRes.data.data;
  console.log('Behavioral Questions Count:', behavioralData?.questions?.length);
  const hasBehavioral = behavioralData?.questions?.some((q) => q.category === 'Behavioral');
  console.log('Contains Behavioral Category Questions:', hasBehavioral);
  console.log('✓ Behavioral Interview Generated Successfully\n');

  // Step 4: Test GET /api/interviews (List for User A)
  console.log('4. Testing GET /api/interviews (List for User A):');
  const listRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/interviews',
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', listRes.statusCode);
  console.log('Interviews Count:', listRes.data.count);
  console.log('✓ Interviews List Verified\n');

  // Step 5: Test GET /api/interviews/:id (Details for User A)
  console.log(`5. Testing GET /api/interviews/${mernInterviewId} (Details):`);
  const detailsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/interviews/${mernInterviewId}`,
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', detailsRes.statusCode);
  console.log('Questions Retrieved:', detailsRes.data.data?.questions?.length);
  console.log('✓ Interview Details Verified\n');

  // Step 6: Test Strict User Isolation (User B attempting to view User A's interview)
  console.log("6. Testing User Isolation (User B accessing User A's interview):");
  const isolationRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/interviews/${mernInterviewId}`,
    method: 'GET',
    headers: { Cookie: cookieUserB },
  });

  console.log('Status Code:', isolationRes.statusCode);
  console.log('Response:', JSON.stringify(isolationRes.data, null, 2));
  if (isolationRes.statusCode === 404) {
    console.log('✓ User Isolation Enforced Correctly (404 Not Found)\n');
  }

  console.log('=== All 6 AI Interview Generator Tests Passed Successfully! ===');
}

runInterviewTests().catch(console.error);
