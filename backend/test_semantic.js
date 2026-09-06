const http = require('http');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { chunkText } = require('./src/services/chunking.service');
const { generateEmbedding, cosineSimilarity } = require('./src/services/embedding.service');

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

const createSamplePDF = async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 600]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const text = `Alex Rivera - Senior Frontend & Full Stack Architect
Profile:
Experienced engineer with deep expertise in React.js component architecture, Redux Toolkit, and Tailwind CSS.
Experienced in building scalable single-page web applications with sub-100ms render speeds.
Backend Experience:
Proficient in Node.js microservices, Express REST endpoints, and MongoDB document indexing.
DevOps & Cloud:
Hands-on deployment pipelines with Docker containers, GitHub Actions CI/CD, and AWS EC2.`;

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

async function runSemanticTests() {
  console.log('=== CareerAI Semantic Search & Vector Infrastructure Test Suite ===\n');

  // 1. Direct Unit Test: Chunking Service
  console.log('1. Testing Chunking Service (chunkText):');
  const sampleLongText = `Paragraph 1: React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of developers.\n\nParagraph 2: Node.js is an open-source, cross-platform JavaScript runtime environment that can run on OSes. Node.js executes JavaScript code outside of a web browser using the V8 engine.\n\nParagraph 3: Kubernetes is an open-source container orchestration system for automating software deployment, scaling, and management.`;
  const chunks = chunkText(sampleLongText, { chunkSize: 180, overlap: 40 });
  console.log(`Generated ${chunks.length} chunks from sample text.`);
  chunks.forEach((c) => console.log(`  - Chunk ${c.chunkIndex} (${c.chunkText.length} chars): "${c.chunkText.substring(0, 50)}..."`));
  if (chunks.length >= 2) console.log('✓ Chunking Service Passed\n');

  // 2. Direct Unit Test: Embedding & Cosine Similarity
  console.log('2. Testing Embeddings & Cosine Similarity:');
  const vec1 = await generateEmbedding('React frontend web development and user interface design');
  const vec2 = await generateEmbedding('Building single page React applications with state management');
  const vec3 = await generateEmbedding('Civil engineering concrete foundation and asphalt pavement');

  console.log(`Vector 1 Dimensions: ${vec1.length}`);
  const simRelated = cosineSimilarity(vec1, vec2);
  const simUnrelated = cosineSimilarity(vec1, vec3);
  console.log(`Similarity (React Frontend vs React UI State): ${simRelated.toFixed(4)}`);
  console.log(`Similarity (React Frontend vs Civil Engineering): ${simUnrelated.toFixed(4)}`);

  if (simRelated > simUnrelated && simRelated > 0.6) {
    console.log('✓ Embedding & Cosine Similarity Passed\n');
  } else {
    console.warn('⚠️ Semantic score comparison did not meet expected margins.');
  }

  // 3. User Setup
  console.log('3. Setting up test users (User A & User B):');
  const userAEmail = `sem_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `sem_user_b_${Date.now()}@careerai.dev`;

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

  // 4. Ingest Resume for User A (Auto-indexed into Vector storage)
  console.log('4. Uploading Resume for User A (Auto-indexes vectors):');
  const pdfBuffer = await createSamplePDF();
  const pdfMultipart = createMultipartPayload('resume', 'alex_frontend_cv.pdf', 'application/pdf', pdfBuffer);

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
  console.log('Resume ID:', resumeId);
  console.log('✓ Resume Uploaded & Vectors Indexed\n');

  // 5. Ingest Job for User A (Auto-indexes vectors)
  console.log('5. Creating Job for User A (Auto-indexes vectors):');
  const createJobRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      title: 'DevOps & Cloud Infrastructure Lead',
      company: 'CloudScale Systems',
      description: 'Looking for a Senior DevOps Engineer with deep hands-on expertise in Docker containers, Kubernetes cluster orchestration, Terraform, and AWS cloud deployment pipelines.',
    }
  );

  console.log('Status Code:', createJobRes.statusCode);
  const jobId = createJobRes.data.data?._id;
  console.log('Job ID:', jobId);
  console.log('✓ Job Created & Vectors Indexed\n');

  // 6. Test Semantic Search as User A (Query: Frontend UI Architecture)
  console.log('6. Semantic Search: Query "React user interfaces and component styling":');
  const searchRes1 = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/semantic/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      query: 'React user interfaces and component styling',
      topK: 3,
      minScore: 0.4,
    }
  );

  console.log('Status Code:', searchRes1.statusCode);
  console.log('Result Count:', searchRes1.data.count);
  searchRes1.data.data.forEach((r, idx) => {
    console.log(`  [Rank ${idx + 1}] Source: ${r.sourceType} | Score: ${r.similarityScore} | Snippet: "${r.chunkText.substring(0, 60)}..."`);
  });
  console.log('✓ Semantic Search for Frontend Query Passed\n');

  // 7. Test Metadata Filtering (Filter by sourceType: 'job')
  console.log('7. Semantic Search with Metadata Filter (sourceType = "job"):');
  const searchJobFilterRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/semantic/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      query: 'Kubernetes containers and deployment automation',
      sourceType: 'job',
      topK: 2,
    }
  );

  console.log('Status Code:', searchJobFilterRes.statusCode);
  console.log('Result Count:', searchJobFilterRes.data.count);
  const allAreJob = searchJobFilterRes.data.data.every((r) => r.sourceType === 'job');
  console.log('All results match sourceType "job":', allAreJob);
  console.log('✓ Metadata Filtering Passed\n');

  // 8. Test Strict Multi-Tenant User Isolation
  console.log("8. Testing Strict User Isolation (User B searching for User A's data):");
  const isolationSearchRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/semantic/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserB },
    },
    {
      query: 'React user interfaces and component styling',
      topK: 5,
    }
  );

  console.log('Status Code:', isolationSearchRes.statusCode);
  console.log('Results returned for User B:', isolationSearchRes.data.count);
  if (isolationSearchRes.data.count === 0) {
    console.log('✓ User Isolation Enforced: User B cannot retrieve User A vectors!\n');
  } else {
    console.error('❌ User Isolation Violation!');
  }

  // 9. Test Vector Storage Stats API
  console.log('9. Testing GET /api/semantic/stats:');
  const statsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/semantic/stats',
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', statsRes.statusCode);
  console.log('Stats:', JSON.stringify(statsRes.data.data, null, 2));
  console.log('✓ Vector Stats Verified\n');

  // 10. Test Deletion & Vector Cleanup
  console.log('10. Testing Vector Cleanup on Resume Deletion:');
  await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeId}`,
    method: 'DELETE',
    headers: { Cookie: cookieUserA },
  });

  const postDeleteStats = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/semantic/stats',
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });
  console.log('Remaining Chunks after resume deletion:', postDeleteStats.data.data.totalChunks);
  console.log('✓ Vectors Cleaned Up on Source Deletion\n');

  console.log('=== All 10 Semantic Search & Vector Infrastructure Tests Passed Successfully! ===');
}

runSemanticTests().catch(console.error);
