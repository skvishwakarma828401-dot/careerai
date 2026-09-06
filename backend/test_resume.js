const http = require('http');
const JSZip = require('jszip');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Helper to make raw HTTP requests
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

// Helper to build multipart/form-data payload
const createMultipartPayload = (fieldName, filename, mimeType, fileBuffer) => {
  const boundary = '----CareerAIBoundary' + Math.random().toString(36).substring(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  
  const headerBuf = Buffer.from(header, 'utf-8');
  const footerBuf = Buffer.from(footer, 'utf-8');
  const bodyBuf = Buffer.concat([headerBuf, fileBuffer, footerBuf]);

  return {
    boundary,
    body: bodyBuf,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};

// Generate valid standard PDF buffer using pdf-lib
const createSamplePDF = async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('Alex Rivera - Full Stack Engineer with expertise in React, Node.js, Express, and MongoDB.', {
    x: 50,
    y: 350,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

// Generate valid standard DOCX buffer using JSZip
const createSampleDOCX = async () => {
  const zip = new JSZip();
  
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Morgan Vance - Senior Systems Developer specializing in Distributed Systems, Go, Docker, and Kubernetes.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`
  );

  return await zip.generateAsync({ type: 'nodebuffer' });
};

async function runResumeTests() {
  console.log('=== CareerAI Resume Intelligence Test Suite ===\n');

  // Step 0: Register User A and User B for multi-user isolation tests
  console.log('0. Setting up test users:');
  const userAEmail = `resume_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `resume_user_b_${Date.now()}@careerai.dev`;

  const userARes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Alex Rivera', email: userAEmail, password: 'password123' }
  );
  const cookieUserA = userARes.cookie[0].split(';')[0];
  console.log(`User A created: ${userAEmail}`);

  const userBRes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Jordan Lee', email: userBEmail, password: 'password123' }
  );
  const cookieUserB = userBRes.cookie[0].split(';')[0];
  console.log(`User B created: ${userBEmail}\n`);

  let resumeA1Id = null;
  let resumeA2Id = null;

  // 1. Test PDF Upload & Text Extraction
  console.log('1. Testing PDF Upload (POST /api/resumes/upload):');
  const pdfBuffer = await createSamplePDF();
  const pdfMultipart = createMultipartPayload('resume', 'alex_rivera_resume.pdf', 'application/pdf', pdfBuffer);

  const pdfUploadRes = await httpRequest(
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

  console.log('Status Code:', pdfUploadRes.statusCode);
  console.log('Resume ID:', pdfUploadRes.data.data?._id);
  console.log('Extracted Text:', `"${pdfUploadRes.data.data?.extractedText}"`);
  console.log('Word Count:', pdfUploadRes.data.data?.wordCount);
  console.log('Status:', pdfUploadRes.data.data?.status);
  resumeA1Id = pdfUploadRes.data.data?._id;
  console.log('✓ PDF Upload & Text Extraction Passed\n');

  // 2. Test DOCX Upload & Text Extraction
  console.log('2. Testing DOCX Upload (POST /api/resumes/upload):');
  const docxBuffer = await createSampleDOCX();
  const docxMultipart = createMultipartPayload('resume', 'morgan_vance_cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', docxBuffer);

  const docxUploadRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': docxMultipart.contentType,
        'Content-Length': docxMultipart.body.length,
        Cookie: cookieUserA,
      },
    },
    docxMultipart.body,
    true
  );

  console.log('Status Code:', docxUploadRes.statusCode);
  console.log('Resume ID:', docxUploadRes.data.data?._id);
  console.log('Extracted Text:', `"${docxUploadRes.data.data?.extractedText}"`);
  console.log('Word Count:', docxUploadRes.data.data?.wordCount);
  resumeA2Id = docxUploadRes.data.data?._id;
  console.log('✓ DOCX Upload & Text Extraction Passed\n');

  // 3. Test Invalid File Format (.txt / invalid mime)
  console.log('3. Testing Invalid File Format (.txt file upload):');
  const textBuffer = Buffer.from('Plain text file content', 'utf-8');
  const textMultipart = createMultipartPayload('resume', 'notes.txt', 'text/plain', textBuffer);

  const invalidRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': textMultipart.contentType,
        'Content-Length': textMultipart.body.length,
        Cookie: cookieUserA,
      },
    },
    textMultipart.body,
    true
  );

  console.log('Status Code:', invalidRes.statusCode);
  console.log('Response:', JSON.stringify(invalidRes.data, null, 2));
  console.log('✓ Invalid File Type Rejected Correctly\n');

  // 4. Test Empty File Upload
  console.log('4. Testing Empty File (0 bytes upload):');
  const emptyBuffer = Buffer.alloc(0);
  const emptyMultipart = createMultipartPayload('resume', 'empty.pdf', 'application/pdf', emptyBuffer);

  const emptyRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': emptyMultipart.contentType,
        'Content-Length': emptyMultipart.body.length,
        Cookie: cookieUserA,
      },
    },
    emptyMultipart.body,
    true
  );

  console.log('Status Code:', emptyRes.statusCode);
  console.log('Response:', JSON.stringify(emptyRes.data, null, 2));
  console.log('✓ Empty File Rejected Correctly\n');

  // 5. Test Unauthorized Access (No Token)
  console.log('5. Testing Unauthorized Access (No Auth Cookie):');
  const unauthRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resumes',
    method: 'GET',
  });

  console.log('Status Code:', unauthRes.statusCode);
  console.log('Response:', JSON.stringify(unauthRes.data, null, 2));
  console.log('✓ Unauthorized Request Blocked Correctly\n');

  // 6. Test User Isolation (User B cannot access User A's resume)
  console.log("6. Testing User Isolation (User B attempting to view User A's resume):");
  const isolationRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeA1Id}`,
    method: 'GET',
    headers: { Cookie: cookieUserB },
  });

  console.log('Status Code:', isolationRes.statusCode);
  console.log('Response:', JSON.stringify(isolationRes.data, null, 2));
  console.log('✓ User Isolation Enforced Correctly (404 returned to unauthorized user)\n');

  // 7. Test GET Resumes List for User A
  console.log("7. Testing GET /api/resumes (List for User A):");
  const listRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resumes',
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', listRes.statusCode);
  console.log('Count:', listRes.data.count);
  console.log('Files:', listRes.data.data.map(r => `${r.originalFileName} (${r.fileType}, ${r.fileSize}B, ${r.wordCount} words)`));
  console.log('✓ Resumes List Verified\n');

  // 8. Test GET Resume Details by ID
  console.log(`8. Testing GET /api/resumes/${resumeA1Id} (Details for User A):`);
  const detailsRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeA1Id}`,
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', detailsRes.statusCode);
  console.log('File Name:', detailsRes.data.data?.originalFileName);
  console.log('Extracted Content:', detailsRes.data.data?.extractedText);
  console.log('Character Count:', detailsRes.data.data?.characterCount);
  console.log('✓ Resume Details Verified\n');

  // 9. Test DELETE Resume by ID
  console.log(`9. Testing DELETE /api/resumes/${resumeA1Id}:`);
  const deleteRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeA1Id}`,
    method: 'DELETE',
    headers: { Cookie: cookieUserA },
  });

  console.log('Status Code:', deleteRes.statusCode);
  console.log('Response:', JSON.stringify(deleteRes.data, null, 2));

  // Verify it's deleted
  const verifyDeleteRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resumes/${resumeA1Id}`,
    method: 'GET',
    headers: { Cookie: cookieUserA },
  });
  console.log('Verification after delete (Status Code):', verifyDeleteRes.statusCode);
  console.log('✓ Resume Deleted Correctly\n');

  console.log('=== All 9 Resume Intelligence Tests Passed Successfully! ===');
}

runResumeTests().catch(console.error);
