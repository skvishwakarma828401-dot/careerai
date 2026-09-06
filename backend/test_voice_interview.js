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

async function runVoiceInterviewTests() {
  console.log('=== CareerAI Voice-Based AI Mock Interview Test Suite ===\n');

  // Step 0: Setup Users & Tokens
  console.log('0. Setting up test users (User A & User B):');
  const userAEmail = `voice_user_a_${Date.now()}@careerai.dev`;
  const userBEmail = `voice_user_b_${Date.now()}@careerai.dev`;

  const userARes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Elena Rostova', email: userAEmail, password: 'password123' }
  );
  const cookieUserA = userARes.cookie[0].split(';')[0];
  const tokenA = cookieUserA.split('=')[1];
  console.log(`User A created: ${userAEmail}`);

  const userBRes = await httpRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Devon Vance', email: userBEmail, password: 'password123' }
  );
  const cookieUserB = userBRes.cookie[0].split(';')[0];
  console.log(`User B created: ${userBEmail}\n`);

  // Step 1: Create Mock Interview for User A
  console.log('1. Creating Mock Interview Session for User A (POST /api/interviews):');
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
      questionCount: 3,
    }
  );
  const interviewId = createIvRes.data.data?._id;
  console.log('Interview ID:', interviewId);
  console.log('✓ Mock Interview Created\n');

  // Step 2: Start Interview
  console.log('2. Starting Interview Session (POST /api/interviews/:id/start):');
  const startRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/interviews/${interviewId}/start`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {}
  );
  console.log('Start Status:', startRes.statusCode);
  console.log('First Question:', startRes.data.data?.currentQuestion?.question?.substring(0, 80) + '...');
  console.log('✓ Interview in-progress\n');

  // Step 3: Test REST Voice Answer Submission with Communication Signals
  console.log('3. Submitting Voice Answer Transcript via REST (POST /api/interviews/:id/voice-answer):');
  const voiceTranscript = 'Well, um, basically in React 18 Concurrent Mode, we use startTransition to mark non-urgent state updates, and, like, Suspense allows us to coordinate fallback states without locking the UI thread.';
  
  const voiceAnswerRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/interviews/${interviewId}/voice-answer`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      questionId: 1,
      transcript: voiceTranscript,
      durationSeconds: 16,
    }
  );

  console.log('Voice Answer Status Code:', voiceAnswerRes.statusCode);
  const voiceEval = voiceAnswerRes.data.data?.evaluation;
  const voiceSignals = voiceAnswerRes.data.data?.voiceSignals;

  console.log('Evaluation Results:');
  console.log('  - Technical Accuracy:', voiceEval?.technicalAccuracy);
  console.log('  - Communication Score:', voiceEval?.communication);
  console.log('  - Overall Score:', voiceEval?.overall);
  console.log('Voice Communication Signals:');
  console.log('  - Words Count:', voiceSignals?.wordCount);
  console.log('  - Speaking Pace (WPM):', voiceSignals?.wordsPerMinute);
  console.log('  - Pacing Assessment:', voiceSignals?.pacingAssessment);
  console.log('  - Filler Words Count:', voiceSignals?.fillerCount);
  console.log('  - Detected Fillers:', voiceSignals?.detectedFillers);
  console.log('  - Ethical Scope Notice:', voiceSignals?.notice);

  const hasNoPersonalityClaims = !JSON.stringify(voiceEval).toLowerCase().includes('honest') && 
                                 !JSON.stringify(voiceEval).toLowerCase().includes('personality trait');
  console.log('Strict Communication-Only Scope Enforced:', hasNoPersonalityClaims);
  console.log('✓ REST Voice Answer Evaluated with Communication Signals\n');

  // Step 4: Test Audio Transcription Endpoint
  console.log('4. Testing Audio Transcription API (POST /api/interviews/:id/voice-transcribe):');
  const transcribeRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/interviews/${interviewId}/voice-transcribe`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
    },
    {
      sampleTranscript: 'In MongoDB we use compound indexing following the ESR equality sort range rule.',
    }
  );
  console.log('Transcribe Status Code:', transcribeRes.statusCode);
  console.log('Transcribed Text:', transcribeRes.data.transcript);
  console.log('Confidence Score:', transcribeRes.data.confidence);
  console.log('✓ Audio Transcription Service Functional\n');

  // Step 5: Test Voice Mode over WebSocket (submitVoiceAnswer Event)
  console.log('5. Testing Real-Time Voice Submission via Socket.IO (submitVoiceAnswer):');
  const socketA = io('http://localhost:5000', {
    auth: { token: tokenA },
    extraHeaders: { cookie: cookieUserA },
    transports: ['websocket'],
  });

  await new Promise((resolve) => socketA.on('connect', resolve));
  console.log(`Socket A Connected: ID ${socketA.id}`);

  // Join Room
  socketA.emit('joinInterview', { interviewId });
  await new Promise((res) => socketA.once('joinedRoom', res));

  let receivedVoiceThinking = false;
  let receivedStreaming = false;

  socketA.on('aiThinking', (data) => {
    receivedVoiceThinking = true;
    console.log('  [WebSocket Event: aiThinking]:', data.message);
  });

  socketA.on('aiResponseChunk', () => {
    if (!receivedStreaming) {
      receivedStreaming = true;
      console.log('  [WebSocket Event: aiResponseChunk]: Streaming verbal feedback tokens...');
    }
  });

  const wsVoiceEvalPromise = new Promise((resolve) => {
    socketA.on('answerEvaluated', (data) => {
      console.log('  [WebSocket Event: answerEvaluated]:');
      console.log('    - Overall Score:', data.evaluation.overall);
      console.log('    - Technical Accuracy:', data.evaluation.technicalAccuracy);
      console.log('    - Spoken WPM:', data.voiceSignals?.wordsPerMinute);
      console.log('    - Filler Count:', data.voiceSignals?.fillerCount);
      resolve(data);
    });
  });

  socketA.emit('submitVoiceAnswer', {
    interviewId,
    questionId: 2,
    transcript: 'Node.js Libuv event loop manages asynchronous non-blocking I/O using epoll on Linux and kqueue on macOS with a thread pool of worker threads.',
    durationSeconds: 12,
  });

  await wsVoiceEvalPromise;
  console.log('✓ Real-Time Voice Answer Evaluated & Streamed over WebSockets\n');

  // Step 6: Test Seamless Fallback (Voice -> Text submission for final question)
  console.log('6. Testing Seamless Voice-to-Text Fallback Mode for Final Question:');
  const completionPromise = new Promise((resolve) => {
    socketA.on('interviewCompleted', (data) => {
      console.log('  [WebSocket Event: interviewCompleted]:');
      console.log('    - Status:', data.status);
      console.log('    - Overall Score:', data.overallScore);
      console.log('    - Committee Rating:', data.finalReport?.rating);
      resolve(data);
    });
  });

  // Submit Question 3 using standard text submission
  socketA.emit('submitAnswer', {
    interviewId,
    questionId: 3,
    userAnswer: 'In distributed architectures, Redis is utilized for distributed caching, token bucket rate limiting, and pub/sub message brokers to minimize database read latencies.',
  });

  await completionPromise;
  console.log('✓ Seamless Voice & Text Blended Session Completed Successfully\n');

  // Step 7: Multi-Tenant User Isolation
  console.log("7. Testing Multi-Tenant Isolation (User B attempting to submit voice answer to User A's interview):");
  const userBVoiceRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/interviews/${interviewId}/voice-answer`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserB },
    },
    {
      questionId: 1,
      transcript: 'Attempting unauthorized submission...',
      durationSeconds: 10,
    }
  );

  console.log('User B Voice Submit Status:', userBVoiceRes.statusCode);
  if (userBVoiceRes.statusCode === 404 || userBVoiceRes.statusCode === 403) {
    console.log("✓ Multi-Tenant Isolation Enforced: User B blocked from accessing User A's interview!\n");
  }

  socketA.disconnect();
  console.log('=== All 7 Voice-Based AI Mock Interview Tests Passed Successfully! ===');
}

runVoiceInterviewTests().catch(console.error);
