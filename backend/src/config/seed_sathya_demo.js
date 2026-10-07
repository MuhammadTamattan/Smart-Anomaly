import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';

const currFile = fileURLToPath(import.meta.url);
const currDir = path.dirname(currFile);
const uploadsDir = path.join(currDir, '..', '..', 'uploads');
const demoDir = path.join(currDir, '..', '..', '..', 'demo_logs', 'sri_sathya_saravana_pumps');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const SATHYA_DEMO_SCENARIOS = [
  {
    fileName: 'normal_employee_activity.log',
    storedName: 'seed_sathya_normal_employee_activity.log',
    isAnomaly: false,
    anomalyScore: 0.0559,
    severity: 'none',
    analysisResult: {
      summary: 'No anomaly detected. Log appears normal.',
      total_lines_analyzed: 25,
      feature_importance: {
        total_lines: 25,
        info_count: 20,
        error_count: 0,
        warning_count: 0,
        unique_ips: 3,
        failed_auth: 0,
        timeout_count: 0,
        port_scan: 0,
        rate_limit_hits: 0,
        connection_resets: 0,
      },
    },
    alert: null,
  },
  {
    fileName: 'unusual_login_activity.log',
    storedName: 'seed_sathya_unusual_login_activity.log',
    isAnomaly: true,
    anomalyScore: -0.0109,
    severity: 'low',
    analysisResult: {
      summary: 'Anomaly detected with low severity. Key indicators: 7 errors found (46.7% error rate).',
      total_lines_analyzed: 15,
      feature_importance: {
        total_lines: 15,
        error_count: 7,
        warning_count: 2,
        info_count: 1,
        unique_ips: 1,
        failed_auth: 3,
        sql_keywords: 2,
        http_errors: 8,
        error_ratio: 0.4667,
      },
    },
    alert: {
      title: 'Unusual Off-Hours Employee Access (EMP105)',
      description: 'Off-hours session initiated at 02:40 AM from unmapped external IP 198.51.100.77 with unauthorized pump CAD drawing & database query attempts.',
      severity: 'high',
      type: 'suspicious_activity',
      indicators: [
        'Off-hours access at 02:40 AM',
        'Source IP: 198.51.100.77',
        'Target: CAD blueprints & unauthorized SQL queries',
        'Multiple HTTP 403 Forbidden access rejections',
      ],
    },
  },
  {
    fileName: 'failed_login_activity.log',
    storedName: 'seed_sathya_failed_login_activity.log',
    isAnomaly: true,
    anomalyScore: -0.0234,
    severity: 'medium',
    analysisResult: {
      summary: 'Anomaly detected with low severity. Key indicators: 4 errors found (18.2% error rate); 13 warnings detected; 17 authentication failures detected.',
      total_lines_analyzed: 22,
      feature_importance: {
        total_lines: 22,
        failed_auth: 17,
        error_count: 4,
        warning_count: 13,
        http_errors: 17,
        rate_limit_hits: 2,
        unique_ips: 1,
      },
    },
    alert: {
      title: 'ERP Portal Credential Stuffing Burst',
      description: 'Rapid burst of 17 failed authentication attempts within 20 seconds targeting ERP pump accounts (EMP101-EMP105, admin, root) from IP 203.0.113.88.',
      severity: 'critical',
      type: 'brute_force',
      indicators: [
        '17 failed auth attempts in 20 seconds',
        'Target accounts: EMP101, EMP102, EMP103, admin, root',
        'Attacker IP: 203.0.113.88',
        'HTTP 429 Rate limit enforced on auth gateway',
      ],
    },
  },
  {
    fileName: 'excessive_file_access.log',
    storedName: 'seed_sathya_excessive_file_access.log',
    isAnomaly: true,
    anomalyScore: -0.0087,
    severity: 'medium',
    analysisResult: {
      summary: 'Anomaly detected with low severity. Key indicators: 8 errors found (27.6% error rate); 5 warnings detected.',
      total_lines_analyzed: 29,
      feature_importance: {
        total_lines: 29,
        rate_limit_hits: 8,
        error_count: 8,
        warning_count: 5,
        http_errors: 9,
        unique_endpoints: 24,
      },
    },
    alert: {
      title: 'Excessive Pump Blueprint Exfiltration & Rate Limit Surge',
      description: 'High-volume rapid file retrieval burst: 25+ pump CAD drawings and BOM archives downloaded within 60 seconds by EMP103, violating storage rate limits.',
      severity: 'high',
      type: 'high_error_rate',
      indicators: [
        '8 HTTP 429 rate limit events detected',
        'Rapid sequential CAD file downloads (>25 files/min)',
        'Storage quota exceeded on blueprint archive',
        'Account EMP103 temporarily throttled',
      ],
    },
  },
  {
    fileName: 'suspicious_network_activity.log',
    storedName: 'seed_sathya_suspicious_network_activity.log',
    isAnomaly: true,
    anomalyScore: -0.0237,
    severity: 'high',
    analysisResult: {
      summary: 'Anomaly detected with low severity. Key indicators: 16 errors found (64.0% error rate); Port scanning activity detected.',
      total_lines_analyzed: 25,
      feature_importance: {
        total_lines: 25,
        port_scan: 19,
        connection_resets: 14,
        error_count: 16,
        error_ratio: 0.64,
        http_errors: 2,
      },
    },
    alert: {
      title: 'Factory SCADA & ERP Port Reconnaissance Scan',
      description: 'Automated nmap port sweep probing factory Modbus PLC pump controllers (Port 502), ERP database (Port 1433), MQTT telemetry (Port 1883), and web gateways.',
      severity: 'high',
      type: 'port_scan',
      indicators: [
        '19 port scan probe signatures detected',
        '14 TCP connection resets sent by firewall',
        'Probed ports: 21, 22, 502 (Modbus), 1433 (MSSQL), 1883, 3306, 8080',
        'Attacker IP: 198.51.100.200 (Quarantined by edge firewall)',
      ],
    },
  },
];

export const seedSathyaDemoLogs = async () => {
  try {
    console.log('[Seed Demo] Initializing Sri Sathya Saravana Motor and Pumps demo logs in MongoDB...');

    // 1. Get all registered users or fallback to demoUser
    let users = await User.find({});
    if (users.length === 0) {
      console.log('[Seed Demo] Creating default operator user (demo@soc.io)...');
      const defaultUser = await User.create({
        name: 'Alex Vance (Lead Analyst)',
        email: 'demo@soc.io',
        password: 'demo123',
        role: 'admin',
      });
      users = [defaultUser];
    }

    let logsCreated = 0;
    let alertsCreated = 0;

    for (const scenario of SATHYA_DEMO_SCENARIOS) {
      const sourcePath = path.join(demoDir, scenario.fileName);
      const destPath = path.join(uploadsDir, scenario.storedName);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      } else {
        fs.writeFileSync(destPath, `# Synthetic Demo Log: ${scenario.fileName}\n`, 'utf-8');
      }

      const fileStats = fs.statSync(destPath);

      for (const user of users) {
        // Find existing or create
        let log = await Log.findOne({
          originalName: scenario.fileName,
          uploadedBy: user._id,
        });

        const logData = {
          originalName: scenario.fileName,
          storedName: scenario.storedName,
          filePath: destPath,
          fileType: '.log',
          fileSize: fileStats.size,
          uploadedBy: user._id,
          status: 'completed',
          analysisStatus: 'analyzed',
          isAnomaly: scenario.isAnomaly,
          anomalyScore: scenario.anomalyScore,
          severity: scenario.severity,
          analyzedAt: new Date(),
          analysisResult: scenario.analysisResult,
        };

        if (!log) {
          log = await Log.create(logData);
          logsCreated++;
          console.log(`  ✓ Seeded log [${scenario.fileName}] for user [${user.email}]`);
        } else {
          // Update existing to ensure accurate ML results and file path
          await Log.findByIdAndUpdate(log._id, logData);
        }

        // Create alert if anomalous
        if (scenario.alert) {
          const existingAlert = await Alert.findOne({
            sourceLog: log._id,
            user: user._id,
          });

          if (!existingAlert) {
            await Alert.create({
              title: scenario.alert.title,
              description: scenario.alert.description,
              severity: scenario.alert.severity,
              type: scenario.alert.type,
              status: 'new',
              sourceLog: log._id,
              user: user._id,
              anomalyScore: scenario.anomalyScore ? Math.abs(scenario.anomalyScore) : 0.85,
              indicators: scenario.alert.indicators,
              detectedAt: new Date(),
            });
            alertsCreated++;
            console.log(`  ✓ Seeded alert [${scenario.alert.title}] for user [${user.email}]`);
          }
        }
      }
    }

    console.log(`[Seed Demo] Completed: ${logsCreated} logs created/synced, ${alertsCreated} alerts created.`);
    return { logsCreated, alertsCreated };
  } catch (error) {
    console.error('[Seed Demo] Error seeding demo logs:', error.message);
    throw error;
  }
};
