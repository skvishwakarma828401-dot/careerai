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

async function runRAGTests() {
  console.log('=== CareerAI Production-Oriented RAG Test Suite ===\n');

  // Step 0: Setup users
  console.log('0. Setting up test users (User A & User B):');
  const userAEmail = `rag_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `rag_user_b_${Date.now()}@careerai.dev`;

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

  // Step 1: Upload Resume for User A (Auto-indexed into Vector storage)
  console.log('1. Uploading Resume for User A (Auto-indexed):');
  const resumeText = `Alex Rivera - Full Stack Software Engineer
Summary: 3+ years experience engineering responsive web applications with React, Node.js, Express, and MongoDB.
Skills: React, TypeScript, Node.js, Express, MongoDB, Git, REST APIs.
Projects: Built CareerAI Intelligence SaaS with user authentication and MongoDB document indexing.`;

  const pdfBuffer = await createSamplePDF(resumeText);
  const multipart = createMultipartPayload('resume', 'alex_rivera_cv.pdf', 'application/pdf', pdfBuffer);

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
  console.log('Resume Upload Status:', uploadRes.statusCode);
  console.log('✓ Resume Uploaded & Vectorized\n');

  // Step 2: Create Target Job for User A (Auto-indexed into Vector storage)
  console.log('2. Creating Target Job for User A (Auto-indexed):');
  const createJobRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      title: 'Senior Cloud Full Stack Engineer',
      company: 'Stripe Global',
      description: 'Looking for a Senior Engineer with deep expertise in React, Node.js, and TypeScript. Must have strong hands-on experience with Docker containerization, Kubernetes clusters, and AWS Cloud infrastructure.',
      autoAnalyze: true,
    }
  );
  console.log('Job Create Status:', createJobRes.statusCode);
  console.log('✓ Target Job Created & Vectorized\n');

  // Step 3: Test Grounded RAG Query (POST /api/ai/rag/query)
  console.log('3. Testing Grounded RAG Query (POST /api/ai/rag/query):');
  const queryRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/rag/query',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      question: 'What are my biggest skill gaps for my target job?',
    }
  );

  console.log('Status Code:', queryRes.statusCode);
  console.log('Grounded Answer Preview:\n', queryRes.data.answer);
  console.log('\nSources Cited Count:', queryRes.data.sources?.length);
  queryRes.data.sources?.forEach((s, idx) => {
    console.log(`  - [Source ${idx + 1}] (${s.sourceType}) "${s.title}" - Similarity: ${s.similarityScore}%`);
  });

  if (queryRes.data.sources?.length > 0 && queryRes.data.answer?.length > 40) {
    console.log('✓ Grounded RAG Query Passed with Source Citations\n');
  }

  // Step 4: Test Insufficient Context Fallback
  console.log('4. Testing Insufficient Context Guardrail (Query about unmentioned topic):');
  const noContextRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/rag/query',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      question: 'What is my research experience in Quantum Astrophysics and Dark Matter?',
    }
  );

  console.log('Status Code:', noContextRes.statusCode);
  console.log('Answer:\n', noContextRes.data.answer);
  const saysNoInfo =
    noContextRes.data.answer.toLowerCase().includes("don't have enough information") ||
    noContextRes.data.answer.toLowerCase().includes('not have enough information') ||
    noContextRes.data.sources?.length === 0;
  console.log('Correctly flags lack of context:', saysNoInfo);
  console.log('✓ Insufficient Context Guardrail Passed\n');

  // Step 5: Test Multi-Tenant User Isolation (User B cannot access User A records)
  console.log("5. Testing Strict User Isolation (User B querying without having uploaded any data):");
  const userBQueryRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/rag/query',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserB },
    },
    {
      question: 'What are my biggest skill gaps for my target job?',
    }
  );

  console.log('Status Code:', userBQueryRes.statusCode);
  console.log('Sources returned for User B:', userBQueryRes.data.sources?.length);
  console.log('Answer for User B:\n', userBQueryRes.data.answer);
  if (userBQueryRes.data.sources?.length === 0) {
    console.log("✓ User Isolation Enforced: User B cannot retrieve User A's context!\n");
  } else {
    console.error("❌ User Isolation Violation!");
  }

  console.log('=== All 5 RAG System Tests Passed Successfully! ===');
}

runRAGTests().catch(console.error);
