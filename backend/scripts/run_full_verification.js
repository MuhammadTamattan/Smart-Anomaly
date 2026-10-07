import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import WebsiteScan from '../src/models/WebsiteScan.js';
import jwt from 'jsonwebtoken';

dotenv.config();

async function runVerification() {
  console.log('====================================================');
  console.log('COMPREHENSIVE WEBSITE SCANNER VERIFICATION SUITE');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anomaly_detection');

  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      name: 'Security Officer',
      email: 'officer@srisathya.com',
      password: 'Password123!',
      role: 'admin',
    });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_jwt_secret_key_12345', {
    expiresIn: '1d',
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const results = [];

  // TEST 1: Valid HTTPS URL
  try {
    console.log('Running Test 1: Valid HTTPS URL (https://example.com)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.scan.https?.enabled === true) {
      results.push({ test: '1. Valid HTTPS URL', passed: true, detail: `Status 201, HTTPS: true, Risk: ${data.scan.riskScore}` });
    } else {
      results.push({ test: '1. Valid HTTPS URL', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '1. Valid HTTPS URL', passed: false, detail: err.message });
  }

  // TEST 2: Valid HTTP URL
  try {
    console.log('Running Test 2: Valid HTTP URL (http://example.com)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'http://example.com' }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      results.push({ test: '2. Valid HTTP URL', passed: true, detail: `Status 201, HTTPS: ${data.scan.https?.enabled}, Risk: ${data.scan.riskScore}` });
    } else {
      results.push({ test: '2. Valid HTTP URL', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '2. Valid HTTP URL', passed: false, detail: err.message });
  }

  // TEST 3: Invalid URL
  try {
    console.log('Running Test 3: Invalid URL format (ftp://invalid)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'ftp://invalid-domain.com' }),
    });
    const data = await res.json();
    if (res.status === 400 && !data.success) {
      results.push({ test: '3. Invalid URL (Protocol)', passed: true, detail: `Blocked with 400: "${data.message}"` });
    } else {
      results.push({ test: '3. Invalid URL (Protocol)', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '3. Invalid URL', passed: false, detail: err.message });
  }

  // TEST 4: Empty URL
  try {
    console.log('Running Test 4: Empty URL ("")...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: '   ' }),
    });
    const data = await res.json();
    if (res.status === 400 && !data.success) {
      results.push({ test: '4. Empty URL', passed: true, detail: `Rejected with 400: "${data.message}"` });
    } else {
      results.push({ test: '4. Empty URL', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '4. Empty URL', passed: false, detail: err.message });
  }

  // TEST 5: Unreachable URL
  try {
    console.log('Running Test 5: Unreachable URL (non-existent domain)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'https://nonexistent-website-random-987654321.com' }),
    });
    const data = await res.json();
    if (res.status === 502 || res.status === 400) {
      results.push({ test: '5. Unreachable URL', passed: true, detail: `Status ${res.status}: "${data.message}"` });
    } else {
      results.push({ test: '5. Unreachable URL', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '5. Unreachable URL', passed: false, detail: err.message });
  }

  // TEST 6: URL with redirects
  try {
    console.log('Running Test 6: URL with redirects (http://github.com -> https)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'http://github.com' }),
    });
    const data = await res.json();
    if (res.status === 201 && data.scan.redirectCount >= 1) {
      results.push({ test: '6. URL with redirects', passed: true, detail: `Status 201, Redirects: ${data.scan.redirectCount}, Final: ${data.scan.url}` });
    } else {
      results.push({ test: '6. URL with redirects', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '6. URL with redirects', passed: false, detail: err.message });
  }

  // TEST 7: Website with missing security headers
  try {
    console.log('Running Test 7: Website with missing headers (example.com)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const data = await res.json();
    const missingHeaders = data.scan.findings?.filter(f => f.category === 'headers' && f.level === 'warning');
    if (res.status === 201 && missingHeaders.length > 0) {
      results.push({ test: '7. Missing Security Headers', passed: true, detail: `Identified ${missingHeaders.length} missing headers with warnings` });
    } else {
      results.push({ test: '7. Missing Security Headers', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '7. Missing Security Headers', passed: false, detail: err.message });
  }

  // TEST 8: Website with available security headers
  try {
    console.log('Running Test 8: Website with available security headers (cloudflare.com or github.com)...');
    const res = await fetch('http://localhost:5000/api/website-scanner/scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'https://github.com' }),
    });
    const data = await res.json();
    const presentHeaders = Object.values(data.scan.securityHeaders || {}).filter(h => h.present);
    if (res.status === 201 && presentHeaders.length > 0) {
      results.push({ test: '8. Available Security Headers', passed: true, detail: `Detected ${presentHeaders.length}/6 active headers (HSTS, CSP, etc.)` });
    } else {
      results.push({ test: '8. Available Security Headers', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '8. Available Security Headers', passed: false, detail: err.message });
  }

  // TEST 9: Scan History
  try {
    console.log('Running Test 9: Scan history retrieval...');
    const res = await fetch('http://localhost:5000/api/website-scanner/history', { headers });
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.scans) && data.total > 0) {
      results.push({ test: '9. Scan History', passed: true, detail: `Retrieved ${data.scans.length} scans, total in DB: ${data.total}` });
    } else {
      results.push({ test: '9. Scan History', passed: false, detail: JSON.stringify(data) });
    }
  } catch (err) {
    results.push({ test: '9. Scan History', passed: false, detail: err.message });
  }

  // TEST 10: Dashboard Integration
  try {
    console.log('Running Test 10: Dashboard statistics integration...');
    const res = await fetch('http://localhost:5000/api/dashboard/stats', { headers });
    const data = await res.json();
    const act = data.websiteScanActivity;
    if (res.status === 200 && act && typeof act.totalScanned === 'number' && Array.isArray(act.recentScans)) {
      results.push({
        test: '10. Dashboard Integration',
        passed: true,
        detail: `totalScanned: ${act.totalScanned}, high: ${act.highRisk}, med: ${act.mediumRisk}, low: ${act.lowRisk}, recent: ${act.recentScans.length}`,
      });
    } else {
      results.push({ test: '10. Dashboard Integration', passed: false, detail: JSON.stringify(act) });
    }
  } catch (err) {
    results.push({ test: '10. Dashboard Integration', passed: false, detail: err.message });
  }

  // TEST 11: Existing Modules Regression Check
  try {
    console.log('Running Test 11: Checking existing endpoints regression...');
    const [logRes, repRes, altRes] = await Promise.all([
      fetch('http://localhost:5000/api/logs', { headers }),
      fetch('http://localhost:5000/api/reports/summary', { headers }),
      fetch('http://localhost:5000/api/alerts', { headers }),
    ]);
    const logData = await logRes.json();
    const repData = await repRes.json();
    const altData = await altRes.json();
    if (logRes.status === 200 && repRes.status === 200 && altRes.status === 200) {
      results.push({
        test: '11. Existing Modules Integrity',
        passed: true,
        detail: `Logs: ${logData.logs?.length ?? 0}, Alerts: ${altData.alerts?.length ?? 0}, Reports: healthy`,
      });
    } else {
      results.push({ test: '11. Existing Modules Integrity', passed: false, detail: 'One or more modules failed' });
    }
  } catch (err) {
    results.push({ test: '11. Existing Modules Integrity', passed: false, detail: err.message });
  }

  console.log('\n====================================================');
  console.log('TEST RESULTS SUMMARY:');
  console.log('====================================================');
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✓ PASS' : '✕ FAIL';
    console.log(`${symbol} | ${r.test} -> ${r.detail}`);
    if (!r.passed) allPassed = false;
  }
  console.log('====================================================');
  console.log(allPassed ? 'ALL VERIFICATION TESTS PASSED SUCCESSFULLY!' : 'SOME TESTS FAILED.');
  console.log('====================================================');

  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
