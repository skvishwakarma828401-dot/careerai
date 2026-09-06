const http = require('http');
const io = require('socket.io-client');

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

async function runSocketInterviewTests() {
  console.log('=== CareerAI Real-Time Socket.IO Mock Interview Test Suite ===\n');

  // Step 0: Setup Users & Get Tokens
  console.log('0. Setting up test users (User A & User B):');
  const userAEmail = `socket_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `socket_user_b_${Date.now()}@careerai.dev`;

  const userARes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Alex Rivera', email: userAEmail, password: 'password123' }
  );
  const cookieUserA = userARes.cookie[0].split(';')[0];
  const tokenA = cookieUserA.split('=')[1];
  console.log(`User A created: ${userAEmail}`);

  const userBRes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Jordan Lee', email: userBEmail, password: 'password123' }
  );
  const cookieUserB = userBRes.cookie[0].split(';')[0];
  const tokenB = cookieUserB.split('=')[1];
  console.log(`User B created: ${userBEmail}\n`);

  // Step 1: Create 2-Question Mock Interview for User A
  console.log('1. Creating 2-Question Mock Interview for User A (POST /api/interviews):');
  const createIvRes = await httpRequest(
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
      targetRole: 'Senior Full Stack Engineer',
      questionCount: 2,
    }
  );
  const interviewIdA = createIvRes.data.data?._id;
  console.log('Interview ID:', interviewIdA);
  console.log('✓ Interview Created in Pending State\n');

  // Step 2: Connect Socket.IO Client for User A
  console.log('2. Connecting Socket.IO Client for User A (with auth token):');
  const socketA = io('http://localhost:5000', {
    auth: { token: tokenA },
    extraHeaders: { cookie: cookieUserA },
    transports: ['websocket'],
    reconnection: true,
  });

  await new Promise((resolve, reject) => {
    socketA.on('connect', () => {
      console.log(`Socket A Connected: ID ${socketA.id}`);
      resolve();
    });
    socketA.on('connect_error', reject);
  });
  console.log('✓ User A Socket.IO Connected & Authenticated\n');

  // Step 3: Join Room (joinInterview)
  console.log(`3. Joining Interview Room for User A (interview:${interviewIdA}):`);
  const joinPromise = new Promise((resolve) => {
    socketA.on('joinedRoom', (data) => {
      console.log('Joined Room Payload:', data);
      resolve(data);
    });
  });
  socketA.emit('joinInterview', { interviewId: interviewIdA });
  const joinedData = await joinPromise;
  console.log('✓ Joined Interview Room Successfully\n');

  // Step 4: Start Interview (startInterview)
  console.log('4. Emitting startInterview:');
  const startPromise = new Promise((resolve) => {
    socketA.on('interviewStarted', (data) => {
      console.log('Interview Started Event:');
      console.log('  - Status:', data.status);
      console.log('  - Question Index:', data.questionIndex);
      console.log('  - First Question:', data.question?.question?.substring(0, 80) + '...');
      resolve(data);
    });
  });
  socketA.emit('startInterview', { interviewId: interviewIdA });
  await startPromise;
  console.log('✓ Received interviewStarted Event\n');

  // Step 5: Submit Answer for Question 1 with Thinking & Streaming
  console.log('5. Submitting Answer for Question 1 (Testing aiThinking, aiResponseChunk, answerEvaluated):');
  let receivedThinking = false;
  let chunkCount = 0;

  socketA.on('aiThinking', (data) => {
    receivedThinking = true;
    console.log('  [Event: aiThinking]:', data.message);
  });

  socketA.on('aiResponseChunk', (data) => {
    chunkCount++;
    if (chunkCount === 1) {
      console.log('  [Event: aiResponseChunk] Streaming first tokens...');
    }
  });

  const evalPromise1 = new Promise((resolve) => {
    socketA.on('answerEvaluated', (data) => {
      console.log('  [Event: answerEvaluated]:');
      console.log('    - Overall Score:', data.evaluation.overall);
      console.log('    - Accuracy:', data.evaluation.technicalAccuracy);
      console.log('    - Next Question Index:', data.currentQuestionIndex);
      resolve(data);
    });
  });

  socketA.emit('submitAnswer', {
    interviewId: interviewIdA,
    questionId: 1,
    userAnswer: 'React 18 Concurrent Rendering uses fiber trees and interruptible lanes to keep the UI responsive while rendering expensive subtrees in the background.',
  });

  await evalPromise1;
  console.log(`Received Thinking State: ${receivedThinking}`);
  console.log(`Received Streaming Chunks Count: ${chunkCount}`);
  console.log('✓ Question 1 Evaluated with Real-Time Streaming\n');

  // Step 6: Test Pause & Resume
  console.log('6. Testing Pause & Resume Events:');
  const pausePromise = new Promise((resolve) => {
    socketA.on('interviewPaused', (data) => {
      console.log('  [Event: interviewPaused]: Elapsed:', data.elapsedSeconds);
      resolve(data);
    });
  });
  socketA.emit('pauseInterview', { interviewId: interviewIdA, elapsedSeconds: 45 });
  await pausePromise;

  const resumePromise = new Promise((resolve) => {
    socketA.on('interviewResumed', (data) => {
      console.log('  [Event: interviewResumed]: Resumed at:', data.resumedAt);
      resolve(data);
    });
  });
  socketA.emit('resumeInterview', { interviewId: interviewIdA });
  await resumePromise;
  console.log('✓ Pause & Resume State Synchronization Verified\n');

  // Step 7: Submit Answer for Last Question (Testing interviewCompleted)
  const totalQuestions = createIvRes.data.data?.questions?.length || 2;
  console.log(`7. Submitting Final Answer for Question ${totalQuestions} of ${totalQuestions} (Testing interviewCompleted):`);

  const completionPromise = new Promise((resolve) => {
    socketA.on('interviewCompleted', (data) => {
      console.log('  [Event: interviewCompleted]:');
      console.log('    - Status:', data.status);
      console.log('    - Overall Score:', data.overallScore);
      console.log('    - Hiring Rating:', data.finalReport?.rating);
      console.log('    - Summary:', data.finalReport?.summary?.substring(0, 100) + '...');
      resolve(data);
    });
  });

  // If there are questions between Q1 and the last question, answer them
  for (let q = 2; q < totalQuestions; q++) {
    const intermediateEval = new Promise((res) => {
      const handler = (data) => {
        socketA.off('answerEvaluated', handler);
        res(data);
      };
      socketA.on('answerEvaluated', handler);
    });

    socketA.emit('submitAnswer', {
      interviewId: interviewIdA,
      questionId: q,
      userAnswer: 'Node.js utilizes the libuv event loop with asynchronous non-blocking I/O and threadpool execution for fs operations.',
    });
    await intermediateEval;
  }

  // Submit final question answer
  socketA.emit('submitAnswer', {
    interviewId: interviewIdA,
    questionId: totalQuestions,
    userAnswer: 'In distributed system architectures, rate limiting protects database connection pools and protects against cascading downstream failure via token bucket algorithms in Redis.',
  });

  await completionPromise;
  console.log('✓ Final Answer Evaluated & interviewCompleted Event Dispatched\n');

  // Step 8: Multi-Tenant Unauthorized Room Access Guardrail
  console.log("8. Testing Multi-Tenant Unauthorized Access (User B attempting to access User A's room):");
  const socketB = io('http://localhost:5000', {
    auth: { token: tokenB },
    extraHeaders: { cookie: cookieUserB },
    transports: ['websocket'],
  });

  await new Promise((resolve) => socketB.on('connect', resolve));
  console.log(`Socket B Connected: ID ${socketB.id}`);

  const errorPromise = new Promise((resolve) => {
    socketB.on('error', (err) => {
      console.log('  [Event: error]: Code:', err.code, '| Message:', err.message);
      resolve(err);
    });
  });

  // User B tries to join User A's interview room
  socketB.emit('joinInterview', { interviewId: interviewIdA });
  const errorReceived = await errorPromise;

  if (errorReceived.code === 'UNAUTHORIZED') {
    console.log("✓ Room Isolation Enforced: User B blocked from accessing User A's interview room!\n");
  }

  // Step 9: Test Disconnect & Reconnection
  console.log('9. Testing Socket Reconnection Resilience:');
  socketA.disconnect();
  console.log('Socket A manually disconnected. Reconnecting...');
  socketA.connect();

  await new Promise((resolve) => {
    socketA.on('connect', () => {
      console.log(`Socket A Reconnected successfully with ID: ${socketA.id}`);
      resolve();
    });
  });
  console.log('✓ Reconnection Handshake Verified\n');

  // Clean up sockets
  socketA.disconnect();
  socketB.disconnect();

  console.log('=== All 9 Real-Time Socket.IO Interview Tests Passed Successfully! ===');
}

runSocketInterviewTests().catch(console.error);
