import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';
import { seedSathyaDemoLogs } from './seed_sathya_demo.js';

const currFile = fileURLToPath(import.meta.url);
const currDir = path.dirname(currFile);
const uploadsDir = path.join(currDir, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Verifying MongoDB database collections...');

    // 1. Check or Seed User
    let demoUser = await User.findOne({ email: 'demo@soc.io' });
    if (!demoUser) {
      console.log('[Seed] Creating initial operator account (demo@soc.io)...');
      demoUser = await User.create({
        name: 'Alex Vance (Lead Analyst)',
        email: 'demo@soc.io',
        password: 'demo123',
        role: 'admin',
      });
      console.log(`[Seed] Demo operator created: ${demoUser.email} (ID: ${demoUser._id})`);
    }

    // 2. Check or Seed Logs
    const logCount = await Log.countDocuments();
    if (logCount === 0) {
      console.log('[Seed] Seeding initial dynamic logs into MongoDB and disk...');

      // Create physical log files in uploads
      const bruteForcePath = path.join(uploadsDir, 'seed_auth_gateway_bruteforce.log');
      const bruteForceContent = [
        '2026-09-21 10:14:01 185.220.101.42 SSH-2.0 POST /ssh/auth 401 "Failed root auth (attempt 14)"',
        '2026-09-21 10:14:02 185.220.101.42 SSH-2.0 POST /ssh/auth 401 "Failed admin auth (attempt 15)"',
        '2026-09-21 10:14:03 185.220.101.42 SSH-2.0 POST /ssh/auth 401 "Rapid dictionary probe: oracle"',
        '2026-09-21 10:14:04 192.168.1.10 HTTPS GET /api/v1/health 200 "Internal SOC probe healthy"',
        '2026-09-21 10:14:05 185.220.101.42 SSH-2.0 POST /ssh/auth 401 "Failed postgres auth (attempt 16)"',
        '2026-09-21 10:14:06 185.220.101.42 SSH-2.0 POST /ssh/auth 401 "SSH key brute-force buffer overrun"',
        '2026-09-21 10:14:07 185.220.101.42 SSH-2.0 POST /ssh/auth 403 "IP auto-quarantine triggered"',
      ].join('\n');
      fs.writeFileSync(bruteForcePath, bruteForceContent, 'utf-8');

      const sqliPath = path.join(uploadsDir, 'seed_waf_sqli_injection_stream.csv');
      const sqliContent = [
        'timestamp,ip,method,endpoint,status,payload',
        '2026-09-21 10:18:11,45.154.255.89,GET,/api/v1/users?id=1 UNION SELECT username,password_hash FROM admin--,500,SQLi',
        '2026-09-21 10:18:12,45.154.255.89,POST,/login?redirect=<script>fetch("http://evil.io")</script>,403,XSS',
        '2026-09-21 10:18:14,10.0.2.14,GET,/static/css/main.css,200,static',
        '2026-09-21 10:18:15,45.154.255.89,GET,/wp-config.php.bak,404,traversal',
      ].join('\n');
      fs.writeFileSync(sqliPath, sqliContent, 'utf-8');

      const ddosPath = path.join(uploadsDir, 'seed_simulated_ddos_synflood.log');
      const ddosContent = [
        '2026-09-21 10:22:00 194.26.29.111 TCP/SYN :443 [SYN] Seq=0 Win=65535 Len=0 DROP Spoofed SYN flood',
        '2026-09-21 10:22:00 194.26.29.112 TCP/SYN :443 [SYN] Seq=0 Win=65535 Len=0 DROP Spoofed SYN flood',
        '2026-09-21 10:22:01 194.26.29.113 TCP/SYN :443 [SYN] Seq=0 Win=65535 Len=0 DROP SYN packet amplification > 12k/s',
        '2026-09-21 10:22:01 172.16.4.1 ICMP Echo Reply latency=0.4ms PASS Internal cluster heartbeat',
        '2026-09-21 10:22:02 194.26.29.114 TCP/SYN :443 [SYN] Seq=0 Win=65535 Len=0 DROP BGP Flowspec scrubbing activated',
      ].join('\n');
      fs.writeFileSync(ddosPath, ddosContent, 'utf-8');

      const cleanPath = path.join(uploadsDir, 'seed_clean_production_cluster.log');
      const cleanContent = [
        '2026-09-21 10:30:00 172.20.0.1 GET /healthz 200 Kubernetes readiness probe',
        '2026-09-21 10:30:04 172.20.0.15 POST /api/telemetry/heartbeat 200 Worker node heartbeat acknowledged',
        '2026-09-21 10:30:08 172.20.0.8 GET /api/v1/metrics/prometheus 200 Scrape job completed in 1.4ms',
        '2026-09-21 10:30:12 172.20.0.22 POST /api/v1/queue/ack 200 Message queue partition flush',
      ].join('\n');
      fs.writeFileSync(cleanPath, cleanContent, 'utf-8');

      // Create Mongoose Log records
      const log1 = await Log.create({
        originalName: 'auth_gateway_bruteforce.log',
        storedName: 'seed_auth_gateway_bruteforce.log',
        filePath: bruteForcePath,
        fileType: '.log',
        fileSize: 428019,
        uploadedBy: demoUser._id,
        status: 'completed',
        analysisStatus: 'analyzed',
        isAnomaly: true,
        anomalyScore: 0.89,
        severity: 'critical',
        analyzedAt: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 7200000),
        analysisResult: {
          summary: 'High-frequency distributed SSH brute force with credential stuffing identified on port 22.',
          total_lines_analyzed: 4892,
          feature_importance: { failed_auth: 16, unique_ips: 42, error_count: 14 },
        },
      });

      const log2 = await Log.create({
        originalName: 'waf_sqli_injection_stream.csv',
        storedName: 'seed_waf_sqli_injection_stream.csv',
        filePath: sqliPath,
        fileType: '.csv',
        fileSize: 1120490,
        uploadedBy: demoUser._id,
        status: 'completed',
        analysisStatus: 'analyzed',
        isAnomaly: true,
        anomalyScore: 0.94,
        severity: 'critical',
        analyzedAt: new Date(Date.now() - 1800000),
        createdAt: new Date(Date.now() - 3600000),
        analysisResult: {
          summary: 'Union-based SQL Injection and reflected XSS payloads detected targeting user authentication service.',
          total_lines_analyzed: 7420,
          feature_importance: { sql_keywords: 9, error_count: 8 },
        },
      });

      const log3 = await Log.create({
        originalName: 'simulated_ddos_synflood.log',
        storedName: 'seed_simulated_ddos_synflood.log',
        filePath: ddosPath,
        fileType: '.log',
        fileSize: 1820491,
        uploadedBy: demoUser._id,
        status: 'completed',
        analysisStatus: 'analyzed',
        isAnomaly: true,
        anomalyScore: 0.88,
        severity: 'high',
        analyzedAt: new Date(Date.now() - 900000),
        createdAt: new Date(Date.now() - 1800000),
        analysisResult: {
          summary: 'Volumetric SYN-Flood anomaly saturating ingress border gateway.',
          total_lines_analyzed: 18920,
          feature_importance: { rate_limit_hits: 140, unique_ips: 85 },
        },
      });

      await Log.create({
        originalName: 'clean_production_cluster.log',
        storedName: 'seed_clean_production_cluster.log',
        filePath: cleanPath,
        fileType: '.log',
        fileSize: 1450200,
        uploadedBy: demoUser._id,
        status: 'completed',
        analysisStatus: 'analyzed',
        isAnomaly: false,
        anomalyScore: 0.04,
        severity: 'low',
        analyzedAt: new Date(Date.now() - 600000),
        createdAt: new Date(Date.now() - 1200000),
        analysisResult: {
          summary: 'Normal baseline production microservice telemetry. No anomalies observed.',
          total_lines_analyzed: 12500,
          feature_importance: {},
        },
      });

      console.log('[Seed] 4 real dynamic logs created in MongoDB.');

      // 3. Seed Alerts
      const alertCount = await Alert.countDocuments();
      if (alertCount === 0) {
        console.log('[Seed] Seeding initial dynamic alerts into MongoDB...');
        await Alert.create([
          {
            title: 'High-Frequency SSH Credential Stuffing',
            description: '4,892 failed SSH authentication sequences detected from coordinated botnet IPs.',
            severity: 'critical',
            type: 'brute_force',
            status: 'investigating',
            sourceLog: log1._id,
            user: demoUser._id,
            anomalyScore: 0.962,
            indicators: ['16 failed auth attempts/sec', 'Target: root, admin', 'Source IP: 185.220.101.42'],
            detectedAt: new Date(Date.now() - 1800000),
          },
          {
            title: 'WAF SQL Injection & Union Extraction',
            description: 'Malicious payload `UNION SELECT username,password_hash` intercepted on `/api/v1/users`.',
            severity: 'critical',
            type: 'sql_injection',
            status: 'new',
            sourceLog: log2._id,
            user: demoUser._id,
            anomalyScore: 0.942,
            indicators: ['SQL keyword: UNION SELECT', 'HTTP 500 unhandled DB exception', 'Attacker IP: 45.154.255.89'],
            detectedAt: new Date(Date.now() - 3600000),
          },
          {
            title: 'Volumetric Distributed SYN-Flood Attack',
            description: 'Massive SYN-packet flood exceeding 18,000 req/s detected targeting port 443.',
            severity: 'high',
            type: 'ddos',
            status: 'new',
            sourceLog: log3._id,
            user: demoUser._id,
            anomalyScore: 0.884,
            indicators: ['Packet rate > 12k/sec', 'Multiple spoofed CIDR blocks', 'Edge scrub engaged'],
            detectedAt: new Date(Date.now() - 5400000),
          },
          {
            title: 'DNS Tunneling & C2 Heartbeat',
            description: 'Anomalous Base32 encoded DNS TXT queries matching known Cobalt Strike beacons.',
            severity: 'high',
            type: 'dns_tunneling',
            status: 'resolved',
            sourceLog: log1._id,
            user: demoUser._id,
            anomalyScore: 0.824,
            indicators: ['Base32 TXT query entropy 4.95', 'Periodic 15.0s jitter', 'Resolved by sinkholing'],
            detectedAt: new Date(Date.now() - 14400000),
            resolvedAt: new Date(Date.now() - 7200000),
          },
          {
            title: 'Unusual Operator Login from Geo-Anomaly IP',
            description: 'Privileged analyst login attempted from unauthorized ASN in Eastern Europe.',
            severity: 'medium',
            type: 'suspicious_activity',
            status: 'resolved',
            sourceLog: log1._id,
            user: demoUser._id,
            anomalyScore: 0.651,
            indicators: ['Geo-location mismatch', 'New device fingerprint', 'MFA verified via push'],
            detectedAt: new Date(Date.now() - 28800000),
            resolvedAt: new Date(Date.now() - 21600000),
          },
          {
            title: 'Internal Gateway High HTTP 500 Error Rate',
            description: 'Elevated 5xx response spike on service mesh proxy exceeding 8.4% error threshold.',
            severity: 'low',
            type: 'high_error_rate',
            status: 'resolved',
            sourceLog: log1._id,
            user: demoUser._id,
            anomalyScore: 0.412,
            indicators: ['Error rate 8.4%', 'Ingress buffer pressure', 'Auto-scaled pod replicas'],
            detectedAt: new Date(Date.now() - 43200000),
            resolvedAt: new Date(Date.now() - 36000000),
          },
        ]);
        console.log('[Seed] 6 real dynamic alerts created in MongoDB.');
      }
    }

    // Always ensure Sri Sathya Saravana Motor & Pumps demo logs are seeded
    await seedSathyaDemoLogs();

    console.log('[Seed] MongoDB initialization completed successfully.');
  } catch (error) {
    console.error(`[Seed] Error initializing dynamic data: ${error.message}`);
  }
};
