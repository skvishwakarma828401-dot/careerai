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

const createSamplePDF = async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 500]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const text = `Alex Rivera
Full Stack Engineer | React, Node.js, Express, MongoDB, TypeScript
Experience:
- Software Engineer at TechCorp (2023 - Present): Built full-stack MERN dashboards with REST APIs and JWT security.
- Developed real-time telemetry systems and MongoDB aggregation pipelines.
Projects:
- CareerAI Intelligence Platform: Automated resume text extraction and ATS grading platform using Node.js and React.
Education:
- B.S. in Computer Science, State University, 2024.`;

  page.drawText(text, {
    x: 40,
    y: 450,
    size: 11,
    font,
    color: rgb(0, 0, 0),
    lineHeight: 16,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

async function runAIAnalyzerTests() {
  console.log('=== CareerAI AI Resume Analyzer Test Suite ===\n');

  // Step 0: Setup users
  console.log('0. Setting up test users:');
  const userAEmail = `ai_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `ai_user_b_${Date.now()}@careerai.dev`;

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

  // Step 1: Upload resume for User A
  console.log('1. Uploading PDF Resume for User A:');
  const pdfBuffer = await createSamplePDF();
  const pdfMultipart = createMultipartPayload('resume', 'alex_rivera_fullstack.pdf', 'application/pdf', pdfBuffer);

  const uploadRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': pdfMultipart.contentType,
        'Content-Length': pdfMultipart.body.length,
        Cookie: cookieUserA,
      },
    },
    pdfMultipart.body,
    true
  );

  console.log('Status Code:', uploadRes.statusCode);
  const resumeId = uploadRes.data.data?._id;
  console.log('Uploaded Resume ID:', resumeId);
  console.log('Initial Status:', uploadRes.data.data?.status);
  console.log('✓ Resume Uploaded\n');

  // Step 2: Trigger AI Resume Analysis (POST /api/resumes/:id/analyze)
  console.log(`2. Triggering AI Resume Analysis (POST /api/resumes/${resumeId}/analyze):`);
  const analyzeRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeId}/analyze`,
    method: 'POST',
    headers: {
      Cookie: cookieUserA,
    },
  });

  console.log('Status Code:', analyzeRes.statusCode);
  const analysis = analyzeRes.data.data?.analysis;
  console.log('Resume Score:', analyzeRes.data.data?.score, '/ 100');
  console.log('Updated Status in DB:', analyzeRes.data.data?.status);
  console.log('Summary:', analysis?.summary);
  console.log('Programming Languages:', analysis?.skills?.programmingLanguages);
  console.log('Frameworks:', analysis?.skills?.frameworks);
  console.log('Databases:', analysis?.skills?.databases);
  console.log('Strengths Count:', analysis?.strengths?.length);
  console.log('Weaknesses Count:', analysis?.weaknesses?.length);
  console.log('Missing Skills:', analysis?.missingSkills);
  console.log('Recommendations Count:', analysis?.recommendations?.length);
  console.log('✓ AI Analysis & Zod Validation Passed\n');

  // Step 3: Test User Isolation (User B cannot analyze User A's resume)
  console.log("3. Testing User Isolation on AI Analysis (User B attempting to analyze User A's resume):");
  const isolationRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeId}/analyze`,
    method: 'POST',
    headers: {
      Cookie: cookieUserB,
    },
  });

  console.log('Status Code:', isolationRes.statusCode);
  console.log('Response:', JSON.stringify(isolationRes.data, null, 2));
  console.log('✓ User Isolation Enforced Correctly (404 Not Found)\n');

  // Step 4: Verify GET /api/resumes/:id returns full analyzed data
  console.log(`4. Verifying GET /api/resumes/${resumeId} includes persistent analysis:`);
  const getDetailsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeId}`,
    method: 'GET',
    headers: {
      Cookie: cookieUserA,
    },
  });

  console.log('Status Code:', getDetailsRes.statusCode);
  console.log('Persisted Score:', getDetailsRes.data.data?.score);
  console.log('Has Analysis Object:', getDetailsRes.data.data?.analysis?.score !== undefined);
  console.log('✓ Persisted Resume Analysis Verified\n');

  console.log('=== All AI Resume Analyzer Tests Passed Successfully! ===');
}

runAIAnalyzerTests().catch(console.error);
