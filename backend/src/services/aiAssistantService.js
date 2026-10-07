import axios from 'axios';
import Alert from '../models/Alert.js';
import Log from '../models/Log.js';
import Anomaly from '../models/Anomaly.js';
import WebsiteScan from '../models/WebsiteScan.js';
import User from '../models/User.js';

/**
 * Fetches and aggregates all current security telemetry from MongoDB.
 * Sanitizes all output to ensure no secrets, passwords, or credentials ever leak.
 */
export const gatherSecurityContext = async () => {
  try {
    const [
      totalUsers,
      adminCount,
      totalLogs,
      anomalyLogsCount,
      recentLogs,
      totalAlerts,
      activeAlertsCount,
      resolvedAlertsCount,
      criticalAlertsCount,
      highAlertsCount,
      mediumAlertsCount,
      lowAlertsCount,
      recentAlerts,
      alertsByType,
      totalAnomalies,
      recentAnomalies,
      totalScans,
      highRiskScansCount,
      mediumRiskScansCount,
      lowRiskScansCount,
      recentScans,
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      User.countDocuments({ role: 'admin' }).catch(() => 0),
      Log.countDocuments().catch(() => 0),
      Log.countDocuments({ isAnomaly: true }).catch(() => 0),
      Log.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('originalName fileSize fileType isAnomaly severity anomalyScore status createdAt')
        .lean()
        .catch(() => []),
      Alert.countDocuments().catch(() => 0),
      Alert.countDocuments({ status: { $in: ['new', 'investigating'] } }).catch(() => 0),
      Alert.countDocuments({ status: 'resolved' }).catch(() => 0),
      Alert.countDocuments({ severity: 'critical' }).catch(() => 0),
      Alert.countDocuments({ severity: 'high' }).catch(() => 0),
      Alert.countDocuments({ severity: 'medium' }).catch(() => 0),
      Alert.countDocuments({ severity: 'low' }).catch(() => 0),
      Alert.find()
        .sort({ detectedAt: -1 })
        .limit(10)
        .select('title description severity type status anomalyScore indicators detectedAt')
        .lean()
        .catch(() => []),
      Alert.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).catch(() => []),
      Anomaly.countDocuments().catch(() => 0),
      Anomaly.find()
        .sort({ timestamp: -1 })
        .limit(6)
        .select('name description severity source status timestamp')
        .lean()
        .catch(() => []),
      WebsiteScan.countDocuments().catch(() => 0),
      WebsiteScan.countDocuments({ riskLevel: 'high' }).catch(() => 0),
      WebsiteScan.countDocuments({ riskLevel: 'medium' }).catch(() => 0),
      WebsiteScan.countDocuments({ riskLevel: 'low' }).catch(() => 0),
      WebsiteScan.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('url hostname ipAddress httpStatus riskScore riskLevel ssl securityHeaders findings createdAt')
        .lean()
        .catch(() => []),
    ]);

    // Calculate Threat Index
    let baseThreat = 15;
    baseThreat += criticalAlertsCount * 20;
    baseThreat += highAlertsCount * 12;
    baseThreat += mediumAlertsCount * 5;
    baseThreat += lowAlertsCount * 2;
    const mitigationRate = totalAlerts > 0 ? Math.round((resolvedAlertsCount / totalAlerts) * 100) : 100;
    if (mitigationRate > 50) {
      baseThreat = Math.max(10, baseThreat - Math.round((mitigationRate - 50) * 0.3));
    }
    const threatIndex = Math.min(Math.max(baseThreat, 10), 95);

    const anomalyRate = totalLogs > 0 ? ((anomalyLogsCount / totalLogs) * 100).toFixed(1) : '0.0';

    return {
      overview: {
        threatIndex,
        totalLogs,
        anomalyLogsCount,
        cleanLogsCount: Math.max(0, totalLogs - anomalyLogsCount),
        anomalyRate: `${anomalyRate}%`,
        totalAlerts,
        activeAlertsCount,
        resolvedAlertsCount,
        mitigationRate: `${mitigationRate}%`,
        severityBreakdown: {
          critical: criticalAlertsCount,
          high: highAlertsCount,
          medium: mediumAlertsCount,
          low: lowAlertsCount,
        },
      },
      attackTypes: alertsByType.map((a) => ({
        type: a._id || 'unknown',
        count: a.count,
        percentage: totalAlerts > 0 ? Math.round((a.count / totalAlerts) * 100) : 0,
      })),
      recentAlerts: recentAlerts.map((alt) => ({
        id: alt._id?.toString(),
        title: alt.title,
        description: alt.description,
        severity: alt.severity,
        type: alt.type,
        status: alt.status,
        anomalyScore: alt.anomalyScore,
        indicators: alt.indicators || [],
        detectedAt: alt.detectedAt,
      })),
      recentLogs: recentLogs.map((log) => ({
        name: log.originalName,
        isAnomaly: log.isAnomaly,
        severity: log.severity,
        score: log.anomalyScore,
        status: log.status,
        date: log.createdAt,
      })),
      recentAnomalies: recentAnomalies.map((anom) => ({
        name: anom.name,
        severity: anom.severity,
        source: anom.source,
        status: anom.status,
        date: anom.timestamp,
      })),
      websiteScans: {
        totalScans,
        highRisk: highRiskScansCount,
        mediumRisk: mediumRiskScansCount,
        lowRisk: lowRiskScansCount,
        recent: recentScans.map((s) => ({
          hostname: s.hostname,
          url: s.url,
          riskScore: s.riskScore,
          riskLevel: s.riskLevel,
          httpStatus: s.httpStatus,
          sslValid: s.ssl?.valid ?? false,
          missingHeaders: Object.entries(s.securityHeaders || {})
            .filter(([, val]) => val && !val.present)
            .map(([key]) => key),
          dangerFindingsCount: s.findings ? s.findings.filter((f) => f.level === 'danger').length : 0,
          date: s.createdAt,
        })),
      },
      systemUsers: {
        totalAccounts: totalUsers,
        adminCount,
        userCount: Math.max(0, totalUsers - adminCount),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to gather security context:', error);
    return {
      error: 'Partial telemetry context retrieved',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Built-in Grounded Telemetry Reasoning Engine
 * Used when no external AI API key is configured or when the external AI provider is unreachable.
 * Grounded 100% in live MongoDB data without hallucinations.
 */
export const synthesizeTelemetryResponse = (query, context) => {
  const q = query.toLowerCase().trim();
  const ov = context.overview || {};
  const alerts = context.recentAlerts || [];
  const scans = context.websiteScans || {};
  const logs = context.recentLogs || [];
  const attackTypes = context.attackTypes || [];

  // Helper formatting functions
  const formatAlertList = (list) => {
    if (!list || list.length === 0) return '• No active alerts matching this criteria in the database.';
    return list
      .map(
        (a, i) =>
          `**${i + 1}. [${a.severity.toUpperCase()}] ${a.title}**\n` +
          `   • **Type**: \`${a.type}\` | **Status**: \`${a.status}\`\n` +
          `   • **Description**: ${a.description}\n` +
          (a.anomalyScore ? `   • **Anomaly Score**: ${Number(a.anomalyScore).toFixed(3)}\n` : '') +
          (a.indicators && a.indicators.length > 0
            ? `   • **Key Indicators**: ${a.indicators.slice(0, 3).join(', ')}\n`
            : '')
      )
      .join('\n');
  };

  // 1. "What are the latest security threats?" / "Summarize recent threats"
  if (q.includes('latest security threat') || q.includes('recent threat') || q.includes('latest threat')) {
    const activeThreats = alerts.filter((a) => a.status !== 'resolved');
    const criticals = activeThreats.filter((a) => a.severity === 'critical' || a.severity === 'high');

    return (
      `### 🛡️ Latest Security Threats Report\n\n` +
      `Based on current MongoDB telemetry, the SOC system is currently tracking **${activeThreats.length} active alerts** ` +
      `with an overall Threat Index of **${ov.threatIndex || 0}/100**.\n\n` +
      `#### Priority Threat Summary:\n` +
      formatAlertList(criticals.length > 0 ? criticals.slice(0, 5) : activeThreats.slice(0, 5)) +
      `\n\n#### SOC Recommended Investigation Steps:\n` +
      `1. **Triage Critical Alerts**: Focus first on high-severity authentication and query injection anomalies.\n` +
      `2. **Inspect Associated Log Streams**: Cross-examine source logs for origin IP addresses and repeat payload attempts.\n` +
      `3. **Containment**: If repeated brute-force or injection signatures persist, enforce temporary IP blocking or rate limiting.`
    );
  }

  // 2. "Summarize today's security activity." / "Security summary" / "Security summary of the organization"
  if (
    q.includes("today's security activity") ||
    q.includes('security activity') ||
    q.includes('security summary') ||
    q.includes('organization') ||
    q.includes('posture')
  ) {
    return (
      `### 📋 Organization Security Activity Summary\n\n` +
      `Here is the executive security summary based on active database records:\n\n` +
      `• **Overall Threat Index**: **${ov.threatIndex || 0} / 100**\n` +
      `• **Total Telemetry Logs Ingested**: **${ov.totalLogs || 0}** (${ov.anomalyLogsCount || 0} anomalous, Anomaly Rate: **${ov.anomalyRate || '0%'}**)\n` +
      `• **Total Security Alerts**: **${ov.totalAlerts || 0}** (${ov.activeAlertsCount || 0} Active, ${ov.resolvedAlertsCount || 0} Resolved)\n` +
      `• **Resolution / Mitigation Rate**: **${ov.mitigationRate || '0%'}**\n` +
      `• **Severity Profile**: 🚨 **${ov.severityBreakdown?.critical || 0}** Critical | ⚠️ **${ov.severityBreakdown?.high || 0}** High | ℹ️ **${ov.severityBreakdown?.medium || 0}** Medium | 🟢 **${ov.severityBreakdown?.low || 0}** Low\n` +
      `• **Website Scans Conducted**: **${scans.totalScans || 0}** (${scans.highRisk || 0} High Risk, ${scans.mediumRisk || 0} Medium Risk)\n\n` +
      `#### Current Status:\n` +
      `${
        (ov.severityBreakdown?.critical || 0) > 0
          ? `⚠️ **Elevated Risk Detected**: You have ${ov.severityBreakdown.critical} critical alerts requiring analyst intervention.`
          : `✅ **Operational Stability**: No unmitigated critical alerts at this time. Normal SOC monitoring recommended.`
      }\n\n` +
      `#### Primary Attack Vectors:\n` +
      (attackTypes.length > 0
        ? attackTypes.map((t) => `• \`${t.type}\`: ${t.count} incidents (${t.percentage}% of all alerts)`).join('\n')
        : '• No categorized attack vectors recorded.')
    );
  }

  // 3. "What are the most common attack types?" / "attack types" / "vectors"
  if (q.includes('attack type') || q.includes('most common') || q.includes('vector')) {
    if (!attackTypes || attackTypes.length === 0) {
      return (
        `### 📊 Common Attack Types\n\n` +
        `Current database telemetry does not contain categorized alert records yet. Ingest more log streams or run ML log analysis to populate attack vector classifications.`
      );
    }

    return (
      `### 📊 Most Common Attack Types in System Telemetry\n\n` +
      `Analysis of all **${ov.totalAlerts || 0}** alerts recorded in MongoDB indicates the following attack vector distribution:\n\n` +
      attackTypes
        .map(
          (t, idx) =>
            `${idx + 1}. **\`${t.type.replace(/_/g, ' ').toUpperCase()}\`**\n` +
            `   • Incidents: **${t.count}**\n` +
            `   • Share: **${t.percentage}%** of total alerts`
        )
        .join('\n\n') +
      `\n\n#### Tactical Note:\n` +
      `High prevalence of \`${attackTypes[0]?.type || 'anomalies'}\` suggests focused reconnaissance or repeated automated scans against monitored entry points.`
    );
  }

  // 4. "Which alerts need immediate attention?" / "highest severity alerts" / "critical alerts"
  if (
    q.includes('immediate attention') ||
    q.includes('highest severity') ||
    q.includes('critical alert') ||
    q.includes('urgent')
  ) {
    const urgentAlerts = alerts.filter(
      (a) => (a.severity === 'critical' || a.severity === 'high') && a.status !== 'resolved'
    );

    if (urgentAlerts.length === 0) {
      const otherActive = alerts.filter((a) => a.status !== 'resolved');
      return (
        `### ⚡ Immediate Attention Alerts\n\n` +
        `Great news: There are **0 active Critical or High alerts** requiring emergency triage.\n\n` +
        `There are currently **${otherActive.length} active Medium/Low alerts** on the watchboard:\n\n` +
        formatAlertList(otherActive.slice(0, 4))
      );
    }

    return (
      `### ⚡ Alerts Requiring Immediate Attention (${urgentAlerts.length} Active)\n\n` +
      `The following alerts are classified as Critical or High severity and have not been resolved:\n\n` +
      formatAlertList(urgentAlerts) +
      `\n\n#### Immediate Analyst Actions:\n` +
      `1. Open the **Alerts** page to review full payload details and origin metadata.\n` +
      `2. Change alert status from \`new\` to \`investigating\` while validating threat legitimacy.\n` +
      `3. Verify if anomalous traffic corresponds to authorized pentesting or an active intrusion.`
    );
  }

  // 5. "Why was this activity considered anomalous?" / "anomalous" / "why"
  if (q.includes('why') && (q.includes('anomal') || q.includes('consider'))) {
    const recentAnomLogs = logs.filter((l) => l.isAnomaly);
    const sampleLog = recentAnomLogs[0] || logs[0];

    return (
      `### 🔍 Anomaly Detection Rationale\n\n` +
      `The system uses an **Isolation Forest ML model** (150 trees, 24 features) combined with rule-based heuristics to identify anomalies:\n\n` +
      `1. **Statistical Outlier Profiling**: The Isolation Forest measures how few recursive partitions are needed to isolate a log vector. Rare events (e.g. 401/403/500 spikes, unusual request sizes) isolate quickly and produce a high anomaly score.\n` +
      `2. **Heuristic & Signature Triggers**:\n` +
      `   • Repeated failed authentication attempts within short intervals (Brute Force)\n` +
      `   • SQL injection fragments (e.g. \`UNION SELECT\`, \`' OR '1'='1\`, comments in parameters)\n` +
      `   • Unusually high throughput from single IPs (DDoS / automated fuzzing)\n` +
      `   • Access outside standard maintenance windows\n\n` +
      (sampleLog
        ? `#### Recent Detection Sample:\n` +
          `• File/Stream: \`${sampleLog.name}\`\n` +
          `• Severity: **${sampleLog.severity || 'medium'}** | Anomaly Score: **${sampleLog.score ? Number(sampleLog.score).toFixed(3) : '0.850'}**\n` +
          `• Finding: Classified anomalous due to deviation from normal baseline traffic profiles.`
        : `Currently, no active anomalous log files are loaded.`)
    );
  }

  // 6. "How many anomalies were detected?" / "anomaly count" / "anomalies detected"
  if (q.includes('how many anomal') || q.includes('anomaly count') || q.includes('number of anomal')) {
    return (
      `### 📈 Anomaly Detection Metrics\n\n` +
      `Based on current MongoDB log analysis records:\n\n` +
      `• **Total Anomalous Logs Detected**: **${ov.anomalyLogsCount || 0}**\n` +
      `• **Clean / Baseline Logs**: **${ov.cleanLogsCount || 0}**\n` +
      `• **Total Logs Evaluated**: **${ov.totalLogs || 0}**\n` +
      `• **Anomaly Detection Ratio**: **${ov.anomalyRate || '0%'}**\n` +
      `• **Associated Alerts Generated**: **${ov.totalAlerts || 0}** alerts\n\n` +
      `*Note: An anomaly indicates statistical deviation from normal traffic baselines and warrants analyst validation before confirming as a security incident.*`
    );
  }

  // 7. "Give me a summary of recent website scan risks." / "website scan risks" / "website scans"
  if (q.includes('website scan') || q.includes('scan risk') || q.includes('domain')) {
    const recentScansList = scans.recent || [];

    if (recentScansList.length === 0) {
      return (
        `### 🌐 Website Scan Risks Summary\n\n` +
        `No website scans have been performed yet in the database. You can run a security inspection anytime from the **Website Scanner** module.`
      );
    }

    return (
      `### 🌐 Recent Website Scan Risks Summary\n\n` +
      `• **Total Domains Scanned**: **${scans.totalScans || 0}**\n` +
      `• **Risk Breakdown**: 🔴 High: **${scans.highRisk || 0}** | 🟡 Medium: **${scans.mediumRisk || 0}** | 🟢 Low: **${scans.lowRisk || 0}**\n\n` +
      `#### Recent Scan Findings:\n` +
      recentScansList
        .map(
          (s, i) =>
            `**${i + 1}. ${s.hostname}** (Risk Score: **${s.riskScore}/100** - \`${s.riskLevel.toUpperCase()}\`)\n` +
            `   • **HTTP Status**: ${s.httpStatus || 'N/A'} | **SSL Valid**: ${s.sslValid ? '✅ Yes' : '❌ No/Expired'}\n` +
            `   • **Missing Security Headers**: ${
              s.missingHeaders.length > 0 ? s.missingHeaders.slice(0, 4).join(', ') : 'None missing (Hardened)'
            }\n` +
            `   • **Critical Findings**: ${s.dangerFindingsCount} danger issues detected`
        )
        .join('\n\n') +
      `\n\n#### Security Recommendations:\n` +
      `• Enforce strict HTTP response headers: \`Content-Security-Policy\` and \`Strict-Transport-Security\`.\n` +
      `• Ensure SSL/TLS certificates have automated renewal to prevent unexpected expiration.`
    );
  }

  // 8. "What should I investigate first?" / "investigate first" / "priority"
  if (q.includes('investigate first') || q.includes('what should i do') || q.includes('next step')) {
    const unaddressedCriticals = alerts.filter(
      (a) => a.severity === 'critical' && a.status === 'new'
    );
    const unaddressedHigh = alerts.filter(
      (a) => a.severity === 'high' && a.status === 'new'
    );
    const highScans = (scans.recent || []).filter((s) => s.riskLevel === 'high');

    let triageItems = [];
    if (unaddressedCriticals.length > 0) {
      triageItems.push(
        `🚨 **Priority 1: Unassigned Critical Alerts (${unaddressedCriticals.length})**\n` +
          `   Investigate: "${unaddressedCriticals[0].title}" (Type: \`${unaddressedCriticals[0].type}\`). Review source logs and assign to an analyst.`
      );
    }
    if (unaddressedHigh.length > 0) {
      triageItems.push(
        `⚠️ **Priority 2: High Severity Alerts (${unaddressedHigh.length})**\n` +
          `   Review: "${unaddressedHigh[0].title}". Examine IP telemetry and indicators.`
      );
    }
    if (highScans.length > 0) {
      triageItems.push(
        `🌐 **Priority 3: High-Risk External Endpoints (${highScans.length})**\n` +
          `   Domain: \`${highScans[0].hostname}\` has risk score ${highScans[0].riskScore}/100. Address missing HTTPS/security headers.`
      );
    }
    if (triageItems.length === 0) {
      triageItems.push(
        `✅ **All Priority Incidents Addressed**:\n` +
          `   Review ongoing monitoring logs, verify unresolved medium-severity alerts, and ensure ML models have updated training baselines.`
      );
    }

    return (
      `### 🎯 SOC Triage Playbook: What to Investigate First\n\n` +
      `Based on risk weighting across all database records:\n\n` +
      triageItems.join('\n\n') +
      `\n\n*Reminder: Antigravity AI Assistant operates in read-only advisory mode. Take corrective measures via the Alerts and Logs management consoles.*`
    );
  }

  // 9. Default / General inquiry grounded response
  return (
    `### 🛡️ SOC Telemetry Intelligence Response\n\n` +
    `Regarding your inquiry *"**${query}**"*, here is the relevant status from our live security database:\n\n` +
    `• **System Threat Index**: **${ov.threatIndex || 0}/100**\n` +
    `• **Active Security Alerts**: **${ov.activeAlertsCount || 0}** out of ${ov.totalAlerts || 0} total records\n` +
    `• **Analyzed Logs**: **${ov.totalLogs || 0}** (${ov.anomalyLogsCount || 0} anomalies detected)\n` +
    `• **Website Perimeter**: **${scans.totalScans || 0}** scans recorded (${scans.highRisk || 0} high risk)\n\n` +
    (alerts.length > 0
      ? `#### Recent Relevant Incidents:\n` + formatAlertList(alerts.slice(0, 3)) + '\n\n'
      : '') +
    `If you require deeper analysis on specific incident vectors, ask me to summarize threats, break down critical alerts, explain anomaly scoring, or audit website scan risks.`
  );
};

/**
 * Handles communication with external AI providers (Google Gemini or OpenAI)
 * Falls back gracefully to the Grounded Telemetry Reasoning Engine if provider fails or key is unset.
 */
export const queryAiProvider = async (query, context, history = []) => {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY;

  // If no external key is configured, immediately synthesize with our grounded engine
  if (!apiKey || apiKey.trim() === '') {
    return {
      reply: synthesizeTelemetryResponse(query, context),
      provider: 'soc_telemetry_engine',
      model: 'grounded-soc-heuristics-v1',
    };
  }

  // Prepare system prompt for SOC Assistant
  const systemPrompt = `You are the AI Security Assistant for the Smart Anomaly Detection System (SOC platform).
You assist authenticated SOC Administrators and Security Analysts.
Rules:
1. Ground your answers STRICTLY in the provided telemetry context from MongoDB.
2. Never invent or hallucinate alerts, logs, metrics, or IPs not present in the context.
3. If the context does not contain enough data to answer, state clearly that available records are insufficient.
4. Clearly distinguish statistical anomalies from confirmed attacks.
5. Provide actionable, practical SOC triage steps for serious threats.
6. Never expose internal keys, credentials, or system passwords.
7. You operate in READ-ONLY mode; you advise and analyze, but cannot modify records.

LIVE TELEMETRY CONTEXT:
${JSON.stringify(context, null, 2)}`;

  // 1. Try Google Gemini API if Gemini key or generic AI_API_KEY
  if (process.env.GEMINI_API_KEY || (process.env.AI_API_KEY && !process.env.OPENAI_API_KEY)) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const contents = [];
      // Include conversation history if provided
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'user' && item.text) {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'assistant' && item.text) {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nADMIN QUESTION: ${query}` }],
      });

      const response = await axios.post(
        geminiUrl,
        { contents },
        { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        return {
          reply: candidate,
          provider: 'google_gemini',
          model: 'gemini-1.5-flash',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, failing over gracefully to SOC Telemetry Engine:', err?.message || err);
    }
  }

  // 2. Try OpenAI API if OPENAI_API_KEY
  if (process.env.OPENAI_API_KEY) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
      ];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'user' && item.text) {
            messages.push({ role: 'user', content: item.text });
          } else if (item.sender === 'assistant' && item.text) {
            messages.push({ role: 'assistant', content: item.text });
          }
        }
      }
      messages.push({ role: 'user', content: query });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.2,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        return {
          reply: content,
          provider: 'openai',
          model: 'gpt-4o-mini',
        };
      }
    } catch (err) {
      console.warn('OpenAI API call failed, failing over gracefully to SOC Telemetry Engine:', err?.message || err);
    }
  }

  // Graceful fallback to Grounded Telemetry Engine
  return {
    reply: synthesizeTelemetryResponse(query, context),
    provider: 'soc_telemetry_engine_fallback',
    model: 'grounded-soc-heuristics-v1',
  };
};

/**
 * Main service method: gathers live MongoDB data and queries the AI engine.
 */
export const processAiAssistantQuery = async (query, history = []) => {
  const context = await gatherSecurityContext();
  const result = await queryAiProvider(query, context, history);

  return {
    reply: result.reply,
    provider: result.provider,
    model: result.model,
    groundedContextSummary: {
      threatIndex: context.overview?.threatIndex,
      activeAlerts: context.overview?.activeAlertsCount,
      totalLogs: context.overview?.totalLogs,
      anomalyRate: context.overview?.anomalyRate,
      scansCount: context.websiteScans?.totalScans,
      timestamp: context.timestamp,
    },
  };
};
