import dns from 'dns';
import tls from 'tls';
import { URL } from 'url';

/**
 * Validates whether an IP string belongs to private, loopback, or reserved subnets
 * to prevent Server-Side Request Forgery (SSRF).
 */
export const isPrivateOrReservedIp = (ip) => {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  // IPv4 Checks
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [a, b] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private network)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private network: 172.16.0.0 – 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private network)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata: 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Shared address space)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  // IPv6 Checks
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true; // Loopback / Unspecified
  if (normalized.startsWith('fe80:')) return true; // Link-local
  if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return true; // Unique local

  return false;
};

/**
 * Validates URL format and verifies DNS resolution does not point to internal/private IPs.
 */
export const validateAndResolveUrl = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please provide a valid website URL.');
  }

  let urlToParse = rawUrl.trim();
  // If no scheme is present at all, default to https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(urlToParse)) {
    urlToParse = `https://${urlToParse}`;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlToParse);
  } catch {
    throw new Error('Invalid URL format. Please enter a valid HTTP or HTTPS address.');
  }

  // Strictly enforce http: and https: protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are supported for scanning.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Block explicit loopback / internal hostnames
  const blockedHostnames = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'metadata.google.internal',
    'instance-data',
  ];
  if (blockedHostnames.includes(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new Error('URL cannot be scanned for security reasons (restricted host).');
  }

  // Check if hostname is an IP literal
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('URL cannot be scanned for security reasons (private or restricted IP address).');
    }
    return { parsedUrl, resolvedIp: hostname, hostname };
  }

  // Resilient DNS resolution to verify all destination IPs
  const resolvedAddresses = await resolveHostnameResiliently(hostname);

  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    throw new Error(`Unable to resolve domain "${hostname}". Please check that the URL exists.`);
  }

  // Check every resolved IP address against SSRF filter
  for (const addr of resolvedAddresses) {
    if (isPrivateOrReservedIp(addr.address)) {
      throw new Error('URL cannot be scanned for security reasons (private or restricted IP address).');
    }
  }

  return {
    parsedUrl,
    resolvedIp: resolvedAddresses[0].address,
    hostname,
  };
};

/**
 * Multi-tier resilient DNS resolver with system, resolve4, and public recursive fallback.
 */
export const resolveHostnameResiliently = async (hostname) => {
  // Strategy 1: System getaddrinfo lookup
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    if (addresses && addresses.length > 0) {
      return addresses;
    }
  } catch {
    // System lookup failed, proceed to next strategies
  }

  // Strategy 2: System DNS resolve4
  try {
    const v4 = await dns.promises.resolve4(hostname);
    if (v4 && v4.length > 0) {
      return v4.map((ip) => ({ address: ip, family: 4 }));
    }
  } catch {
    // Proceed to public resolvers
  }

  // Strategy 3: Resilient public resolvers (Google, Cloudflare, Quad9)
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1', '9.9.9.9']);
    const v4 = await resolver.resolve4(hostname);
    if (v4 && v4.length > 0) {
      return v4.map((ip) => ({ address: ip, family: 4 }));
    }
  } catch {
    // Try IPv6
  }

  // Strategy 4: Resilient public resolver IPv6
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
    const v6 = await resolver.resolve6(hostname);
    if (v6 && v6.length > 0) {
      return v6.map((ip) => ({ address: ip, family: 6 }));
    }
  } catch {
    // Try short delay retry
  }

  // Strategy 5: Short delay retry
  await new Promise((r) => setTimeout(r, 400));
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8']);
    const v4 = await resolver.resolve4(hostname);
    if (v4 && v4.length > 0) {
      return v4.map((ip) => ({ address: ip, family: 4 }));
    }
  } catch {
    // Fail
  }

  throw new Error(`Unable to reach this website (DNS lookup failed for "${hostname}").`);
};

/**
 * Safely inspects SSL/TLS certificate of an HTTPS host without crashing on untrusted certs.
 */
export const checkTlsCertificate = (hostname, ipOverride = null) => {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: ipOverride || hostname,
          port: 443,
          servername: hostname,
          timeout: 7000,
          rejectUnauthorized: false,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate(true);
            const isAuthorized = socket.authorized;
            const authError = socket.authorizationError ? String(socket.authorizationError) : null;

            if (!cert || Object.keys(cert).length === 0) {
              socket.destroy();
              return resolve({
                valid: false,
                issuer: null,
                subject: null,
                validFrom: null,
                validTo: null,
                daysRemaining: null,
                error: 'No peer certificate presented by server.',
              });
            }

            const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
            const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
            let daysRemaining = null;
            if (validTo) {
              daysRemaining = Math.max(0, Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            }

            const issuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Unknown CA') : 'Unknown CA';
            const subject = cert.subject ? (cert.subject.CN || hostname) : hostname;

            socket.destroy();
            resolve({
              valid: isAuthorized && daysRemaining > 0,
              issuer,
              subject,
              validFrom,
              validTo,
              daysRemaining,
              error: isAuthorized ? null : authError,
            });
          } catch (err) {
            socket.destroy();
            resolve({
              valid: false,
              issuer: null,
              subject: null,
              validFrom: null,
              validTo: null,
              daysRemaining: null,
              error: err.message,
            });
          }
        }
      );

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          valid: false,
          issuer: null,
          subject: null,
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          error: err.message,
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          valid: false,
          issuer: null,
          subject: null,
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          error: 'TLS handshake timed out.',
        });
      });
    } catch (err) {
      resolve({
        valid: false,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        error: err.message,
      });
    }
  });
};

/**
 * Main Website Scanner Engine
 */
export const scanWebsiteUrl = async (inputUrl) => {
  const startTime = Date.now();

  // 1. SSRF & Protocol Validation
  const { parsedUrl, resolvedIp, hostname } = await validateAndResolveUrl(inputUrl);

  const isHttps = parsedUrl.protocol === 'https:';

  // 2. SSL/TLS Certificate Verification (if HTTPS)
  let sslDetails = {
    valid: false,
    issuer: null,
    subject: null,
    validFrom: null,
    validTo: null,
    daysRemaining: null,
    error: isHttps ? null : 'Plain HTTP does not use TLS/SSL encryption.',
  };

  if (isHttps) {
    sslDetails = await checkTlsCertificate(hostname, resolvedIp);
  }

  // 3. Perform Defensive HTTP Request with Redirect Tracking
  let currentUrl = parsedUrl.toString();
  let redirectCount = 0;
  const redirectChain = [];
  let finalResponse = null;
  let lastStatus = 200;
  let lastStatusText = 'OK';
  let responseHeaders = {};

  const MAX_REDIRECTS = 5;

  while (redirectCount <= MAX_REDIRECTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (SmartAnomaly-Scanner/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      finalResponse = res;
      lastStatus = res.status;
      lastStatusText = res.statusText || 'OK';

      // Extract headers from current step
      responseHeaders = {};
      for (const [key, val] of res.headers.entries()) {
        responseHeaders[key.toLowerCase()] = val;
      }

      // Check if redirect response (301, 302, 303, 307, 308)
      if (res.status >= 300 && res.status < 400 && res.headers.has('location')) {
        const locationHeader = res.headers.get('location');
        redirectCount++;
        redirectChain.push(currentUrl);

        if (redirectCount > MAX_REDIRECTS) {
          break;
        }

        // Resolve relative redirect URL
        const nextUrl = new URL(locationHeader, currentUrl).toString();

        // Validate redirect target with SSRF filter
        const redirectCheck = await validateAndResolveUrl(nextUrl);
        currentUrl = redirectCheck.parsedUrl.toString();
      } else {
        // Final destination reached
        break;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Website scan timed out after 8 seconds.');
      }
      throw new Error(`Unable to reach this website (${err.message}).`);
    }
  }

  const responseTimeMs = Date.now() - startTime;

  // 4. Security Headers Evaluation
  const secHeaders = {
    contentSecurityPolicy: {
      present: Boolean(responseHeaders['content-security-policy']),
      value: responseHeaders['content-security-policy'] || null,
    },
    strictTransportSecurity: {
      present: Boolean(responseHeaders['strict-transport-security']),
      value: responseHeaders['strict-transport-security'] || null,
    },
    xFrameOptions: {
      present: Boolean(responseHeaders['x-frame-options']),
      value: responseHeaders['x-frame-options'] || null,
    },
    xContentTypeOptions: {
      present: Boolean(responseHeaders['x-content-type-options']),
      value: responseHeaders['x-content-type-options'] || null,
    },
    referrerPolicy: {
      present: Boolean(responseHeaders['referrer-policy']),
      value: responseHeaders['referrer-policy'] || null,
    },
    permissionsPolicy: {
      present: Boolean(responseHeaders['permissions-policy'] || responseHeaders['feature-policy']),
      value: responseHeaders['permissions-policy'] || responseHeaders['feature-policy'] || null,
    },
  };

  const configuredHeadersCount = Object.values(secHeaders).filter((h) => h.present).length;

  // 5. Findings & Transparent Rule-Based Risk Calculation
  const findings = [];
  let calculatedRisk = 0;

  // Check HTTPS
  if (isHttps) {
    findings.push({
      category: 'https',
      level: 'pass',
      title: 'HTTPS enabled',
      description: 'Communication with this website is encrypted in transit using TLS.',
    });
  } else {
    calculatedRisk += 25;
    findings.push({
      category: 'https',
      level: 'danger',
      title: 'Insecure HTTP protocol',
      description: 'The website uses unencrypted HTTP communication. User data can be intercepted by third parties.',
    });
  }

  // Check SSL Certificate
  if (isHttps) {
    if (sslDetails.valid) {
      findings.push({
        category: 'ssl',
        level: 'pass',
        title: 'Valid SSL/TLS certificate',
        description: `Issued by ${sslDetails.issuer}. Certificate is valid for ${sslDetails.daysRemaining} more days.`,
      });
    } else {
      calculatedRisk += 30;
      findings.push({
        category: 'ssl',
        level: 'danger',
        title: 'SSL/TLS certificate warning',
        description: sslDetails.error || 'The certificate is expired, self-signed, or untrusted.',
      });
    }
  }

  // Check Security Headers
  if (secHeaders.contentSecurityPolicy.present) {
    findings.push({
      category: 'headers',
      level: 'pass',
      title: 'Content-Security-Policy (CSP) active',
      description: 'CSP restricts unauthorized script execution and helps mitigate Cross-Site Scripting (XSS).',
    });
  } else {
    calculatedRisk += 15;
    findings.push({
      category: 'headers',
      level: 'warning',
      title: 'CSP header missing',
      description: 'No Content-Security-Policy header detected. Increases exposure to script injection and XSS.',
    });
  }

  if (secHeaders.strictTransportSecurity.present) {
    findings.push({
      category: 'headers',
      level: 'pass',
      title: 'HSTS enforced',
      description: 'Strict-Transport-Security header enforces HTTPS connections on modern browsers.',
    });
  } else if (isHttps) {
    calculatedRisk += 15;
    findings.push({
      category: 'headers',
      level: 'warning',
      title: 'HSTS header missing',
      description: 'HSTS is not configured. Allows potential SSL stripping attacks on initial connections.',
    });
  }

  if (secHeaders.xFrameOptions.present) {
    findings.push({
      category: 'headers',
      level: 'pass',
      title: 'Clickjacking Protection Active',
      description: `X-Frame-Options is set to "${secHeaders.xFrameOptions.value}". Prevents unauthorized framing.`,
    });
  } else {
    calculatedRisk += 10;
    findings.push({
      category: 'headers',
      level: 'warning',
      title: 'Missing X-Frame-Options Header',
      description: 'X-Frame-Options header is absent. Website could potentially be embedded in malicious iframes.',
    });
  }

  if (secHeaders.xContentTypeOptions.present) {
    findings.push({
      category: 'headers',
      level: 'pass',
      title: 'MIME-Sniffing Protection Enabled',
      description: 'X-Content-Type-Options is set to nosniff, preventing MIME-type confusion attacks.',
    });
  } else {
    calculatedRisk += 10;
    findings.push({
      category: 'headers',
      level: 'warning',
      title: 'Missing X-Content-Type-Options Header',
      description: 'MIME-type sniffing is not explicitly disabled by the web server.',
    });
  }

  if (secHeaders.referrerPolicy.present) {
    findings.push({
      category: 'headers',
      level: 'pass',
      title: 'Referrer-Policy Defined',
      description: `Referrer policy is configured as "${secHeaders.referrerPolicy.value}".`,
    });
  } else {
    calculatedRisk += 5;
    findings.push({
      category: 'headers',
      level: 'warning',
      title: 'Missing Referrer-Policy Header',
      description: 'Referrer policy is not explicitly defined. Browsers use default referrer rules.',
    });
  }

  if (secHeaders.permissionsPolicy.present) {
    findings.push({
      category: 'headers',
      level: 'pass',
      title: 'Permissions-Policy Configured',
      description: 'Browser device permissions (microphone, camera, geolocation) are controlled.',
    });
  } else {
    calculatedRisk += 5;
    findings.push({
      category: 'headers',
      level: 'warning',
      title: 'Missing Permissions-Policy Header',
      description: 'Permissions-Policy header is absent. Browser hardware features are not restricted.',
    });
  }

  // Check Redirects
  if (redirectCount > 3) {
    calculatedRisk += 10;
    findings.push({
      category: 'redirects',
      level: 'warning',
      title: 'Excessive Redirect Hops',
      description: `Request followed ${redirectCount} redirect hops, which may indicate configuration drift or redirection latency.`,
    });
  } else {
    findings.push({
      category: 'redirects',
      level: 'pass',
      title: 'Normal Redirection Flow',
      description: `Website resolved with ${redirectCount} redirect${redirectCount === 1 ? '' : 's'}.`,
    });
  }

  // Check HTTP Status
  if (lastStatus >= 400) {
    calculatedRisk += 10;
    findings.push({
      category: 'network',
      level: 'warning',
      title: `HTTP Status Code ${lastStatus}`,
      description: `Server returned client/server error response (${lastStatus} ${lastStatusText}).`,
    });
  } else {
    findings.push({
      category: 'network',
      level: 'pass',
      title: 'Website reachable',
      description: `Target endpoint responded with HTTP ${lastStatus} ${lastStatusText} in ${responseTimeMs}ms.`,
    });
  }

  // Clamp Risk Score to [5, 100]
  const finalRiskScore = Math.min(100, Math.max(5, calculatedRisk));

  // Determine Risk Level
  let riskLevel = 'low';
  if (finalRiskScore >= 70) {
    riskLevel = 'high';
  } else if (finalRiskScore >= 36) {
    riskLevel = 'medium';
  }

  const serverBanner = responseHeaders['server'] || null;

  return {
    url: parsedUrl.toString(),
    hostname,
    ipAddress: resolvedIp,
    httpStatus: lastStatus,
    statusText: lastStatusText,
    responseTimeMs,
    https: {
      enabled: isHttps,
      protocol: isHttps ? 'HTTPS/TLS' : 'HTTP',
    },
    ssl: sslDetails,
    redirectCount,
    redirectChain,
    securityHeaders: secHeaders,
    headersScore: {
      configured: configuredHeadersCount,
      total: 6,
    },
    findings,
    riskScore: finalRiskScore,
    riskLevel,
    serverBanner,
    scanDate: new Date(),
  };
};
