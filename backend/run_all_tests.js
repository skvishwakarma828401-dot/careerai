const { execSync } = require('child_process');
const path = require('path');

const TEST_SUITES = [
  { name: 'Authentication & Session Security', file: 'test_auth.js' },
  { name: 'Resume Upload & Multi-Format Parsing', file: 'test_resume.js' },
  { name: 'AI Resume Intelligence & ATS Scoring', file: 'test_ai_analyzer.js' },
  { name: 'Job Description Intelligence & Parsing', file: 'test_jobs.js' },
  { name: 'Dense Embeddings & Vector Search', file: 'test_semantic.js' },
  { name: 'Deterministic Resume-to-Job Matcher', file: 'test_matcher.js' },
  { name: 'Production RAG & Knowledge Retrieval', file: 'test_rag.js' },
  { name: 'AI Mock Interview Generator', file: 'test_interview.js' },
  { name: 'AI Mock Interview Flow & Adaptive Engine', file: 'test_interview_flow.js' },
  { name: 'AI Career Mentor & Memory Tools', file: 'test_mentor.js' },
  { name: 'Personalized Roadmaps & Career Analytics', file: 'test_roadmap_analytics.js' },
  { name: 'Real-Time Socket.IO Interview Engine', file: 'test_socket_interview.js' },
  { name: 'Voice-Based AI Mock Interviews & Audio', file: 'test_voice_interview.js' },
  { name: 'Redis & BullMQ Background Processing', file: 'test_background_jobs.js' },
  { name: 'Comprehensive Production Security Audit', file: 'test_security_audit.js' },
];

console.log('===============================================================');
console.log('         CareerAI Enterprise Platform Master Test Suite         ');
console.log('===============================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];
const startTime = Date.now();

for (let i = 0; i < TEST_SUITES.length; i++) {
  const suite = TEST_SUITES[i];
  const suiteStart = Date.now();
  process.stdout.write(`[${i + 1}/${TEST_SUITES.length}] Running ${suite.name} (${suite.file})... `);

  try {
    const output = execSync(`node ${suite.file}`, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const elapsed = ((Date.now() - suiteStart) / 1000).toFixed(2);
    console.log(`✓ PASSED (${elapsed}s)`);
    totalPassed++;
    results.push({ name: suite.name, file: suite.file, status: 'PASSED', elapsed });
  } catch (err) {
    const elapsed = ((Date.now() - suiteStart) / 1000).toFixed(2);
    console.log(`✗ FAILED (${elapsed}s)`);
    console.error(`\n--- Error Details for ${suite.file} ---`);
    console.error(err.stdout || err.stderr || err.message);
    console.error('--------------------------------------\n');
    totalFailed++;
    results.push({ name: suite.name, file: suite.file, status: 'FAILED', elapsed });
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n===============================================================');
console.log(`                    TEST SUMMARY REPORT                        `);
console.log('===============================================================');
console.log(`Total Test Suites Executed: ${TEST_SUITES.length}`);
console.log(`Suites Passed:              ${totalPassed} (${((totalPassed / TEST_SUITES.length) * 100).toFixed(0)}%)`);
console.log(`Suites Failed:              ${totalFailed}`);
console.log(`Total Execution Time:       ${totalDuration}s`);
console.log('===============================================================\n');

if (totalFailed > 0) {
  console.error(`❌ Test run completed with ${totalFailed} failing suite(s).`);
  process.exit(1);
} else {
  console.log(`✅ All ${totalPassed} Test Suites Passed Successfully!`);
  process.exit(0);
}
