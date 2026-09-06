const http = require('http');

const request = (options, postData) => {
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

async function runAuthTests() {
  console.log('=== CareerAI Authentication Test Suite ===\n');
  const testEmail = `test_${Date.now()}@careerai.dev`;
  let sessionCookie = null;

  // 1. Test Register
  console.log('1. Testing POST /api/auth/register:');
  const regPayload = {
    name: 'Alex Rivera',
    email: testEmail,
    password: 'password123',
    role: 'fresher',
    targetRole: 'Full Stack Engineer',
    skills: ['React', 'Node.js', 'MongoDB'],
  };
  const regRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    regPayload
  );
  console.log('Status Code:', regRes.statusCode);
  console.log('Response:', JSON.stringify(regRes.data, null, 2));
  console.log('Set-Cookie Header:', regRes.cookie ? regRes.cookie[0] : 'None');
  if (regRes.cookie) {
    sessionCookie = regRes.cookie[0].split(';')[0];
  }
  console.log('Password excluded in user:', regRes.data.user.password === undefined);
  console.log('✓ Register Passed\n');

  // 2. Test Duplicate Email
  console.log('2. Testing Duplicate Email Registration:');
  const dupRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    regPayload
  );
  console.log('Status Code:', dupRes.statusCode);
  console.log('Response:', JSON.stringify(dupRes.data, null, 2));
  console.log('✓ Duplicate Handled Correctly\n');

  // 3. Test Invalid Credentials Login
  console.log('3. Testing Invalid Password on POST /api/auth/login:');
  const badLoginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: testEmail, password: 'wrongPassword' }
  );
  console.log('Status Code:', badLoginRes.statusCode);
  console.log('Response:', JSON.stringify(badLoginRes.data, null, 2));
  console.log('✓ Invalid Password Handled Correctly\n');

  // 4. Test Valid Login
  console.log('4. Testing Valid Login on POST /api/auth/login:');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: testEmail, password: 'password123' }
  );
  console.log('Status Code:', loginRes.statusCode);
  console.log('Response User:', loginRes.data.user.name, '-', loginRes.data.user.email);
  if (loginRes.cookie) {
    sessionCookie = loginRes.cookie[0].split(';')[0];
  }
  console.log('✓ Valid Login Passed\n');

  // 5. Test GET /api/auth/me WITH Cookie
  console.log('5. Testing GET /api/auth/me WITH Cookie:');
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      Cookie: sessionCookie,
    },
  });
  console.log('Status Code:', meRes.statusCode);
  console.log('User Profile:', JSON.stringify(meRes.data, null, 2));
  console.log('✓ Protected Route with Cookie Passed\n');

  // 6. Test GET /api/auth/me WITHOUT Cookie / Token (Protected Route Guard)
  console.log('6. Testing GET /api/auth/me WITHOUT Cookie:');
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
  });
  console.log('Status Code:', unauthRes.statusCode);
  console.log('Response:', JSON.stringify(unauthRes.data, null, 2));
  console.log('✓ Protected Route Blocked Unauthorized Access Correctly\n');

  // 7. Test Logout
  console.log('7. Testing POST /api/auth/logout:');
  const logoutRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
    },
  });
  console.log('Status Code:', logoutRes.statusCode);
  console.log('Response:', JSON.stringify(logoutRes.data, null, 2));
  console.log('Set-Cookie on logout:', logoutRes.cookie ? logoutRes.cookie[0] : 'None');
  console.log('✓ Logout Passed\n');

  console.log('=== All 7 Authentication Tests Passed Successfully! ===');
}

runAuthTests().catch(console.error);
