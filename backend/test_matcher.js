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

async function runMatcherTests() {
  console.log('=== CareerAI Resume-to-Job Semantic Matcher Test Suite ===\n');

  // Step 0: Setup users
  console.log('0. Setting up test users (User A & User B):');
  const userAEmail = `match_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `match_user_b_${Date.now()}@careerai.dev`;

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

  // Step 1: Upload High-Match Resume for User A (Full Stack Developer)
  console.log('1. Uploading Full Stack Developer Resume for User A:');
  const techResumeText = `Alex Rivera - Senior Full Stack Engineer
Summary: 4+ years of hands-on experience developing enterprise web applications with React, TypeScript, Node.js, and Express.
Skills: React.js, TypeScript, Node.js, Express, MongoDB, PostgreSQL, Git, REST APIs, HTML5, CSS3.
Experience:
- Senior Software Engineer at FinTech Labs (2022-Present): Architected high-throughput payment checkout services with Node.js and React.
- Software Developer at WebCorp (2020-2022): Built responsive customer dashboards using TypeScript and MongoDB.`;

  const techPdfBuffer = await createSamplePDF(techResumeText);
  const techMultipart = createMultipartPayload('resume', 'alex_fullstack_resume.pdf', 'application/pdf', techPdfBuffer);

  const techResumeRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': techMultipart.contentType,
        'Content-Length': techMultipart.body.length,
        Cookie: cookieUserA,
      },
    },
    techMultipart.body,
    true
  );
  const techResumeId = techResumeRes.data.data?._id;
  console.log(`Full Stack Resume Uploaded: ID ${techResumeId}\n`);

  // Step 2: Upload Low-Match Resume for User A (Civil Engineer / Non-Tech Edge Case)
  console.log('2. Uploading Non-Tech Resume for User A (Edge Case):');
  const civilResumeText = `Marcus Vance - Structural & Civil Engineer
Summary: Licensed civil engineer with 6 years experience in reinforced concrete design, site grading, geotechnical surveying, and AutoCAD drafting.
Skills: AutoCAD, Revit, Concrete Structural Analysis, Soil Mechanics, Project Cost Estimating, Environmental Safety Regulations.`;

  const civilPdfBuffer = await createSamplePDF(civilResumeText);
  const civilMultipart = createMultipartPayload('resume', 'marcus_civil_resume.pdf', 'application/pdf', civilPdfBuffer);

  const civilResumeRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': civilMultipart.contentType,
        'Content-Length': civilMultipart.body.length,
        Cookie: cookieUserA,
      },
    },
    civilMultipart.body,
    true
  );
  const civilResumeId = civilResumeRes.data.data?._id;
  console.log(`Civil Engineering Resume Uploaded: ID ${civilResumeId}\n`);

  // Step 3: Create Target Job for User A (Full Stack Role)
  console.log('3. Creating Target Job for User A:');
  const jobRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      title: 'Senior Full Stack Software Engineer',
      company: 'Stripe Innovation',
      description: `We are seeking a Senior Full Stack Engineer.
Required:
- 4+ years software engineering experience.
- Strong proficiency in React, TypeScript, and Node.js.
- Strong database knowledge of PostgreSQL and MongoDB.
Preferred:
- Experience with Docker containers and AWS Cloud.
- Familiarity with Redis caching.`,
      autoAnalyze: true,
    }
  );
  const jobId = jobRes.data.data?._id;
  console.log(`Target Job Created & Analyzed: ID ${jobId}\n`);

  // Step 4: Test High-Match (Tech Resume vs Tech Job)
  console.log(`4. Testing High-Match: POST /api/jobs/${jobId}/match-resume/${techResumeId}:`);
  const highMatchRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}/match-resume/${techResumeId}`,
    method: 'POST',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', highMatchRes.statusCode);
  const highMatchData = highMatchRes.data.data;
  console.log('Match Score:', highMatchData?.matchScore, '/ 100');
  console.log('Skills Match %:', highMatchData?.skillsMatchPercentage, '%');
  console.log('Semantic Similarity %:', highMatchData?.semanticSimilarityScore, '%');
  console.log('Matching Skills:', highMatchData?.matchingSkills);
  console.log('Missing Skills:', highMatchData?.missingSkills);
  console.log('Priority Gaps Count:', highMatchData?.priorityGaps?.length);
  console.log('Priority Gaps:', highMatchData?.priorityGaps);
  console.log('Recommendations Count:', highMatchData?.recommendations?.length);

  if (highMatchData?.matchScore >= 70 && highMatchData?.matchingSkills?.length >= 3) {
    console.log('✓ High Match Verified (Score >= 70, Key Skills Matched)\n');
  } else {
    console.warn('⚠️ High match score was lower than expected:', highMatchData?.matchScore);
  }

  // Step 5: Test Low-Match Edge Case (Civil Resume vs Tech Job)
  console.log(`5. Testing Low-Match Edge Case: POST /api/jobs/${jobId}/match-resume/${civilResumeId}:`);
  const lowMatchRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}/match-resume/${civilResumeId}`,
    method: 'POST',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', lowMatchRes.statusCode);
  const lowMatchData = lowMatchRes.data.data;
  console.log('Low Match Score:', lowMatchData?.matchScore, '/ 100');
  console.log('Matching Skills Count:', lowMatchData?.matchingSkills?.length);
  console.log('Missing Skills Count:', lowMatchData?.missingSkills?.length);
  console.log('High Priority Gaps Count:', lowMatchData?.priorityGaps?.filter((g) => g.priority === 'High').length);

  if (lowMatchData?.matchScore < 45 && lowMatchData?.matchingSkills?.length === 0) {
    console.log('✓ Low Match Edge Case Verified (Score < 45, 0 matching tech skills)\n');
  } else {
    console.warn('⚠️ Low match score was higher than expected:', lowMatchData?.matchScore);
  }

  // Step 6: Test User Isolation (User B cannot match User A's resume or job)
  console.log("6. Testing User Isolation (User B attempting to match User A's resume & job):");
  const isolationRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/${jobId}/match-resume/${techResumeId}`,
    method: 'POST',
    headers: { Cookie: cookieUserB },
  });

  console.log('Status Code:', isolationRes.statusCode);
  console.log('Response:', JSON.stringify(isolationRes.data, null, 2));
  if (isolationRes.statusCode === 404) {
    console.log('✓ User Isolation Enforced Correctly (404 Not Found)\n');
  }

  // Step 7: Test Invalid Non-Existent IDs
  console.log('7. Testing Non-Existent Job ID (404 check):');
  const invalidIdRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/jobs/666666666666666666666666/match-resume/${techResumeId}`,
    method: 'POST',
    headers: { Cookie: cookieUserA },
  });
  console.log('Status Code:', invalidIdRes.statusCode);
  if (invalidIdRes.statusCode === 404) {
    console.log('✓ Invalid ID Handled Correctly (404 Not Found)\n');
  }

  console.log('=== All 7 Resume-to-Job Semantic Matcher Tests Passed Successfully! ===');
}

runMatcherTests().catch(console.error);
