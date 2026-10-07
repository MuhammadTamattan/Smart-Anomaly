import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testActions() {
  console.log('1. Login...');
  const loginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'demo@soc.io', password: 'demo123' });

  console.log('Login status:', loginRes.status);
  const token = loginRes.data?.token;
  if (!token) {
    console.error('No token:', loginRes);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  console.log('\n2. Testing Edit Profile PUT /api/auth/profile...');
  const editRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/profile',
    method: 'PUT',
    headers: authHeaders,
  }, {
    name: 'Alex Vance',
    username: 'alexvance',
    email: 'demo@soc.io',
    phone: '+1 (555) 987-6543',
  });
  console.log('Edit profile response:', editRes.status, editRes.data || editRes.raw);

  console.log('\n3. Testing Get Logs GET /api/logs...');
  const logsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/logs',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Logs count:', logsRes.data?.length);

  const firstLog = logsRes.data?.[0];
  if (firstLog) {
    console.log('\n4. Testing Analyze Log POST /api/logs/' + firstLog._id + '/analyze...');
    const analyzeRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/logs/${firstLog._id}/analyze`,
      method: 'POST',
      headers: authHeaders,
    });
    console.log('Analyze response status:', analyzeRes.status, analyzeRes.data || analyzeRes.raw);
  } else {
    console.log('No logs found to test analyze!');
  }
}

testActions().catch(console.error);
