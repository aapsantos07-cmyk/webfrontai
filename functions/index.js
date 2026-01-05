const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

initializeApp();
const db = getFirestore();
const auth = getAuth();

// SECURITY: Store API key in Cloud Secret Manager instead of Firestore
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const gscServiceAccountKey = defineSecret("GSC_SERVICE_ACCOUNT_KEY");
const pageSpeedApiKey = defineSecret("PAGESPEED_API_KEY");

exports.chatWithAI = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    const { message, history, customSystemPrompt } = request.data;

    if (!message || typeof message !== "string") {
      throw new HttpsError("invalid-argument", "Message is required");
    }

    try {
      // SECURITY: Get API key from Cloud Secret Manager
      const apiKey = geminiApiKey.value();

      if (!apiKey) {
        throw new HttpsError("failed-precondition", "API key not configured in Cloud Secrets");
      }

      // Fetch system prompt from Firestore (non-sensitive configuration)
      const settingsDoc = await db.collection("admin").doc("ai_settings").get();
      const systemPrompt = customSystemPrompt ||
                          (settingsDoc.exists ? settingsDoc.data().systemPrompt : null) ||
                          "You are WEBFRONT_AI, a helpful assistant for a digital agency. Answer questions about web development services, pricing, and timelines.";

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // Build conversation history for context
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Start chat with system prompt
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "System instructions: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will follow these instructions." }] },
        ...chatHistory
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

      return { text: responseText };
    } catch (error) {
      console.error("Chat error:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to generate response");
    }
  }
);

// SECURITY: Helper function to verify admin role server-side
async function verifyAdminRole(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const callerDoc = await db.collection("clients").doc(request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new HttpsError("permission-denied", "Admin privileges required");
  }

  return callerDoc.data();
}

// SECURITY: Verify admin before updating AI settings
exports.updateAISettings = onCall(async (request) => {
  await verifyAdminRole(request);

  const { activeModel, systemPrompt, knowledgeSources } = request.data;

  if (!activeModel && !systemPrompt && !knowledgeSources) {
    throw new HttpsError("invalid-argument", "At least one setting required");
  }

  try {
    const settingsRef = db.collection("admin").doc("ai_settings");
    const updateData = {};

    if (activeModel) updateData.activeModel = activeModel;
    if (systemPrompt) updateData.systemPrompt = systemPrompt;
    if (knowledgeSources) updateData.knowledgeSources = knowledgeSources;

    await settingsRef.set(updateData, { merge: true });

    return { success: true, message: "AI settings updated successfully" };
  } catch (error) {
    console.error("Update AI settings error:", error);
    throw new HttpsError("internal", "Failed to update settings");
  }
});

// SECURITY: Verify admin before updating client data
exports.updateClientData = onCall(async (request) => {
  await verifyAdminRole(request);

  const { clientId, updates } = request.data;

  if (!clientId || !updates) {
    throw new HttpsError("invalid-argument", "Client ID and updates required");
  }

  // Prevent role escalation - admins cannot change user roles via this function
  if (updates.role) {
    throw new HttpsError("permission-denied", "Cannot modify user roles");
  }

  try {
    const clientRef = db.collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      throw new HttpsError("not-found", "Client not found");
    }

    await clientRef.update(updates);

    return { success: true, message: "Client updated successfully" };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Update client error:", error);
    throw new HttpsError("internal", "Failed to update client");
  }
});

// SECURITY: Verify admin before deleting clients
exports.deleteClient = onCall(async (request) => {
  await verifyAdminRole(request);

  const { clientId } = request.data;

  if (!clientId) {
    throw new HttpsError("invalid-argument", "Client ID required");
  }

  try {
    // Verify target is not an admin
    const clientDoc = await db.collection("clients").doc(clientId).get();
    if (!clientDoc.exists) {
      throw new HttpsError("not-found", "Client not found");
    }

    if (clientDoc.data().role === 'admin') {
      throw new HttpsError("permission-denied", "Cannot delete admin accounts via this function");
    }

    // Delete Firestore document
    await db.collection("clients").doc(clientId).delete();

    // Delete Firebase Auth user
    await auth.deleteUser(clientId);

    return { success: true, message: "Client deleted successfully" };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Delete client error:", error);
    throw new HttpsError("internal", "Failed to delete client");
  }
});

exports.sendClientInvitation = onCall(async (request) => {
  const { email, name, tempPassword } = request.data;

  // SECURITY: Verify admin role server-side
  await verifyAdminRole(request);

  if (!email || !name || !tempPassword) {
    throw new HttpsError("invalid-argument", "Email, name, and temporary password required");
  }

  try {
    // Get email settings from Firestore
    const settingsDoc = await db.collection("admin").doc("email_settings").get();

    let transporter;
    if (settingsDoc.exists && settingsDoc.data().gmailUser && settingsDoc.data().gmailAppPassword) {
      const settings = settingsDoc.data();
      // Use Gmail SMTP
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: settings.gmailUser,
          pass: settings.gmailAppPassword
        }
      });
    } else {
      // Fallback to console log (for testing)
      console.log("Email settings not configured. Would send:", { email, name, tempPassword });
      return {
        success: true,
        message: "Email settings not configured. Check function logs for credentials.",
        testMode: true
      };
    }

    const mailOptions = {
      from: settingsDoc.data().gmailUser || 'noreply@webfrontai.com',
      to: email,
      subject: 'Welcome to WebFront AI - Account Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background: #f4f4f4; padding: 30px; }
            .credentials { background: #fff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }
            .button { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to WebFront AI</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your account has been created! You can now access your project dashboard.</p>

              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px;">${tempPassword}</code></p>
              </div>

              <p><strong>Important:</strong> For security, you'll be required to reset your password on first login.</p>

              <a href="https://webfrontai.com" class="button">Login to Your Dashboard</a>

              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 WebFront AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "Invitation email sent successfully" };
  } catch (error) {
    console.error("Email error:", error);
    throw new HttpsError("internal", "Failed to send invitation email: " + error.message);
  }
});

// SECURITY: Verify admin before fetching Google Search Console analytics
exports.getAnalyticsData = onCall(
  {
    secrets: [gscServiceAccountKey],
    timeoutSeconds: 60,
    memory: '512MB'
  },
  async (request) => {
    // Verify admin access
    await verifyAdminRole(request);

    const { dateRange = '30daysAgo' } = request.data;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (dateRange === '7daysAgo') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (dateRange === '30daysAgo') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (dateRange === '90daysAgo') {
      startDate.setDate(endDate.getDate() - 90);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Check cache (v2 = numeric data format)
    const cacheKey = `gsc_analytics_v2_${startDateStr}_${endDateStr}`;
    const cacheDoc = await db.collection('analytics_cache').doc(cacheKey).get();

    if (cacheDoc.exists) {
      const cacheData = cacheDoc.data();
      const cacheAge = Date.now() - cacheData.timestamp;
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        return { success: true, data: cacheData.data, generatedAt: cacheData.timestamp, cached: true };
      }
    }

    try {
      // Initialize GSC API
      const serviceAccountKey = JSON.parse(gscServiceAccountKey.value());
      const authClient = new google.auth.JWT(
        serviceAccountKey.client_email,
        null,
        serviceAccountKey.private_key,
        ['https://www.googleapis.com/auth/webmasters.readonly']
      );

      const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
      const siteUrl = 'sc-domain:webfrontai.com';

      // Query 1: Overall performance by date
      const overallResponse = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['date'],
          rowLimit: 1000
        }
      });

      // Query 2: Top queries
      const queriesResponse = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['query'],
          rowLimit: 10
        }
      });

      // Query 3: Top pages
      const pagesResponse = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['page'],
          rowLimit: 10
        }
      });

      // Query 4: Devices
      const devicesResponse = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['device'],
          rowLimit: 10
        }
      });

      // Query 5: Countries
      const countriesResponse = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['country'],
          rowLimit: 10
        }
      });

      // Transform data
      const dailyTrend = (overallResponse.data.rows || []).map(row => ({
        date: row.keys[0],
        users: Math.round(row.clicks),
        sessions: Math.round(row.clicks * 1.2), // Estimate
        pageViews: Math.round(row.impressions / 10) // Estimate
      }));

      const topQueries = (queriesResponse.data.rows || []).map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        position: parseFloat(row.position.toFixed(1))
      }));

      const topPages = (pagesResponse.data.rows || []).map(row => ({
        title: row.keys[0].split('/').pop() || 'Homepage',
        path: row.keys[0],
        views: row.clicks,
        impressions: row.impressions
      }));

      const devices = (devicesResponse.data.rows || []).map(row => ({
        device: row.keys[0].charAt(0).toUpperCase() + row.keys[0].slice(1),
        users: row.clicks
      }));

      const geography = (countriesResponse.data.rows || []).map(row => ({
        country: row.keys[0],
        users: row.clicks
      }));

      // Calculate totals
      const totalClicks = dailyTrend.reduce((sum, day) => sum + day.users, 0);
      const totalImpressions = (overallResponse.data.rows || []).reduce((sum, row) => sum + row.impressions, 0);
      const avgCTR = totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions * 100).toFixed(2)) : 0;
      const avgPosition = parseFloat(((overallResponse.data.rows || []).reduce((sum, row) => sum + row.position, 0) / (overallResponse.data.rows?.length || 1)).toFixed(1));

      const analyticsData = {
        // GSC-specific metrics
        searchPerformance: {
          totalClicks,
          totalImpressions,
          avgCTR,
          avgPosition
        },
        topQueries,

        // Existing structure (adapted from GSC data)
        userBehavior: {
          engagementRate: avgCTR,
          avgSessionDuration: 120, // Placeholder (GSC doesn't provide)
          pagesPerSession: 2.5, // Placeholder
          bounceRate: 45 // Placeholder
        },
        dailyTrend,
        trafficSources: [{ source: 'google', medium: 'organic', users: totalClicks, sessions: totalClicks }],
        devices,
        topPages,
        geography,
        userTypes: [], // Not available from GSC
        topEvents: [] // Not available from GSC
      };

      // Cache the result
      await db.collection('analytics_cache').doc(cacheKey).set({
        data: analyticsData,
        timestamp: Date.now()
      });

      return { success: true, data: analyticsData, generatedAt: Date.now(), cached: false };

    } catch (error) {
      console.error('GSC API Error:', error);
      throw new HttpsError('internal', `Failed to fetch GSC data: ${error.message}`);
    }
  }
);

// Helper function to analyze website audits and calculate realistic improvements
function analyzeWebsite(audits, currentScores) {
  const issues = {
    performance: [],
    accessibility: [],
    seo: [],
    bestPractices: []
  };

  let performanceGain = 0;
  let accessibilityGain = 0;
  let seoGain = 0;
  let bestPracticesGain = 0;
  let estimatedLoadTimeSaved = 0;

  if (!audits) {
    // If no audits available (using cached scores), use conservative estimates
    performanceGain = Math.min(45, 100 - currentScores.performance);
    accessibilityGain = Math.min(20, 100 - currentScores.accessibility);
    seoGain = Math.min(18, 100 - currentScores.seo);
    bestPracticesGain = Math.min(25, 100 - currentScores.bestPractices);
    estimatedLoadTimeSaved = 2.3;
  } else {
    // Analyze Performance Opportunities
    const performanceOpportunities = [
      { key: 'render-blocking-resources', impact: 8, label: 'Eliminate render-blocking resources' },
      { key: 'unused-css-rules', impact: 6, label: 'Remove unused CSS' },
      { key: 'unused-javascript', impact: 7, label: 'Remove unused JavaScript' },
      { key: 'modern-image-formats', impact: 5, label: 'Serve images in next-gen formats' },
      { key: 'offscreen-images', impact: 6, label: 'Defer offscreen images' },
      { key: 'unminified-css', impact: 4, label: 'Minify CSS' },
      { key: 'unminified-javascript', impact: 4, label: 'Minify JavaScript' },
      { key: 'efficient-animated-content', impact: 5, label: 'Use video for animated content' },
      { key: 'uses-long-cache-ttl', impact: 7, label: 'Serve static assets with efficient cache policy' },
      { key: 'uses-optimized-images', impact: 6, label: 'Efficiently encode images' },
      { key: 'uses-text-compression', impact: 5, label: 'Enable text compression' },
      { key: 'uses-responsive-images', impact: 5, label: 'Properly size images' },
      { key: 'server-response-time', impact: 8, label: 'Reduce server response time' },
      { key: 'redirects', impact: 3, label: 'Avoid multiple page redirects' },
      { key: 'uses-rel-preconnect', impact: 4, label: 'Preconnect to required origins' },
      { key: 'font-display', impact: 3, label: 'Ensure text remains visible during webfont load' },
      { key: 'third-party-summary', impact: 6, label: 'Minimize third-party usage' },
      { key: 'largest-contentful-paint-element', impact: 7, label: 'Optimize Largest Contentful Paint' },
      { key: 'lcp-lazy-loaded', impact: 8, label: 'Avoid lazy loading LCP image' },
      { key: 'layout-shift-elements', impact: 6, label: 'Avoid large layout shifts' },
      { key: 'non-composited-animations', impact: 4, label: 'Avoid non-composited animations' },
      { key: 'unsized-images', impact: 5, label: 'Image elements have explicit width and height' }
    ];

    performanceOpportunities.forEach(opp => {
      const audit = audits[opp.key];
      if (audit && audit.score !== null && audit.score < 0.9) {
        issues.performance.push(opp.label);
        performanceGain += opp.impact;

        // Extract estimated time saved if available
        if (audit.numericValue && audit.numericUnit === 'millisecond') {
          estimatedLoadTimeSaved += audit.numericValue / 1000;
        }
      }
    });

    // Analyze Accessibility Issues
    const accessibilityAudits = [
      { key: 'color-contrast', impact: 5, label: 'Improve color contrast' },
      { key: 'image-alt', impact: 4, label: 'Add alt text to images' },
      { key: 'link-name', impact: 4, label: 'Ensure links have discernible text' },
      { key: 'button-name', impact: 4, label: 'Ensure buttons have accessible names' },
      { key: 'html-has-lang', impact: 3, label: 'Add lang attribute to html' },
      { key: 'meta-viewport', impact: 3, label: 'Add viewport meta tag' },
      { key: 'document-title', impact: 2, label: 'Add page title' },
      { key: 'aria-allowed-attr', impact: 3, label: 'Fix ARIA attributes' },
      { key: 'aria-required-attr', impact: 3, label: 'Add required ARIA attributes' },
      { key: 'form-field-multiple-labels', impact: 3, label: 'Fix form field labels' },
      { key: 'heading-order', impact: 2, label: 'Fix heading hierarchy' },
      { key: 'label', impact: 4, label: 'Add form input labels' },
      { key: 'list', impact: 2, label: 'Fix list structure' },
      { key: 'listitem', impact: 2, label: 'Fix list items' },
      { key: 'tabindex', impact: 3, label: 'Fix tab index' }
    ];

    accessibilityAudits.forEach(audit => {
      const auditData = audits[audit.key];
      if (auditData && auditData.score !== null && auditData.score < 1) {
        issues.accessibility.push(audit.label);
        accessibilityGain += audit.impact;
      }
    });

    // Analyze SEO Issues
    const seoAudits = [
      { key: 'meta-description', impact: 4, label: 'Add meta description' },
      { key: 'http-status-code', impact: 5, label: 'Fix HTTP status code' },
      { key: 'link-text', impact: 3, label: 'Use descriptive link text' },
      { key: 'crawlable-anchors', impact: 3, label: 'Make links crawlable' },
      { key: 'is-crawlable', impact: 5, label: 'Ensure page is crawlable' },
      { key: 'robots-txt', impact: 4, label: 'Fix robots.txt' },
      { key: 'hreflang', impact: 3, label: 'Add hreflang tags' },
      { key: 'canonical', impact: 4, label: 'Add canonical URL' },
      { key: 'structured-data', impact: 4, label: 'Add structured data' },
      { key: 'font-size', impact: 2, label: 'Use legible font sizes' },
      { key: 'tap-targets', impact: 3, label: 'Size tap targets appropriately' }
    ];

    seoAudits.forEach(audit => {
      const auditData = audits[audit.key];
      if (auditData && auditData.score !== null && auditData.score < 1) {
        issues.seo.push(audit.label);
        seoGain += audit.impact;
      }
    });

    // Analyze Best Practices Issues
    const bestPracticesAudits = [
      { key: 'uses-https', impact: 5, label: 'Use HTTPS' },
      { key: 'is-on-https', impact: 5, label: 'Ensure all resources use HTTPS' },
      { key: 'geolocation-on-start', impact: 3, label: 'Avoid requesting geolocation on page load' },
      { key: 'notification-on-start', impact: 3, label: 'Avoid requesting notifications on page load' },
      { key: 'no-vulnerable-libraries', impact: 5, label: 'Update vulnerable libraries' },
      { key: 'js-libraries', impact: 4, label: 'Update outdated JavaScript libraries' },
      { key: 'deprecations', impact: 3, label: 'Fix deprecated APIs' },
      { key: 'errors-in-console', impact: 4, label: 'Fix console errors' },
      { key: 'image-aspect-ratio', impact: 3, label: 'Display images with correct aspect ratio' },
      { key: 'csp-xss', impact: 5, label: 'Add Content Security Policy' }
    ];

    bestPracticesAudits.forEach(audit => {
      const auditData = audits[audit.key];
      if (auditData && auditData.score !== null && auditData.score < 1) {
        issues.bestPractices.push(audit.label);
        bestPracticesGain += audit.impact;
      }
    });

    // Cap gains to realistic maximums
    performanceGain = Math.min(performanceGain, Math.min(50, 100 - currentScores.performance));
    accessibilityGain = Math.min(accessibilityGain, Math.min(30, 100 - currentScores.accessibility));
    seoGain = Math.min(seoGain, Math.min(25, 100 - currentScores.seo));
    bestPracticesGain = Math.min(bestPracticesGain, Math.min(30, 100 - currentScores.bestPractices));

    // Calculate estimated load time saved (in seconds)
    estimatedLoadTimeSaved = Math.min(estimatedLoadTimeSaved, 5.0).toFixed(1);
  }

  return {
    performanceGain,
    accessibilityGain,
    seoGain,
    bestPracticesGain,
    estimatedLoadTimeSaved,
    issues
  };
}

// PageSpeed Insights API Integration
exports.runPageSpeedTest = onCall(
  { secrets: [pageSpeedApiKey], timeoutSeconds: 120 },
  async (request) => {
    const { url, email } = request.data;

    // Validation
    const urlRegex = /^https?:\/\/.+\..+/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!url || !urlRegex.test(url)) {
      throw new HttpsError('invalid-argument', 'URL must start with http:// or https://');
    }

    if (!email || !emailRegex.test(email)) {
      throw new HttpsError('invalid-argument', 'Valid email is required');
    }

    try {
      const apiKey = pageSpeedApiKey.value();

      if (!apiKey) {
        throw new HttpsError('failed-precondition', 'PageSpeed API key not configured');
      }

      // Check cache (24hr window)
      const cacheKey = Buffer.from(url).toString('base64');
      const cacheRef = db.collection('pagespeed_cache').doc(cacheKey);
      const cacheDoc = await cacheRef.get();

      let currentScores;
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (cacheDoc.exists && (now - cacheDoc.data().timestamp) < twentyFourHours) {
        // Use cached data
        currentScores = cacheDoc.data().scores;
        console.log('Using cached PageSpeed data for:', url);
      } else {
        // Call PageSpeed Insights API
        console.log('Fetching fresh PageSpeed data for:', url);
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=SEO&category=BEST_PRACTICES&strategy=MOBILE`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new HttpsError('internal', `PageSpeed API returned ${response.status}`);
        }

        const data = await response.json();

        // Extract scores
        currentScores = {
          performance: Math.round(data.lighthouseResult.categories.performance.score * 100),
          accessibility: Math.round(data.lighthouseResult.categories.accessibility.score * 100),
          seo: Math.round(data.lighthouseResult.categories.seo.score * 100),
          bestPractices: Math.round(data.lighthouseResult.categories['best-practices'].score * 100)
        };

        // Cache the result with full audit data
        await cacheRef.set({
          url,
          scores: currentScores,
          audits: data.lighthouseResult.audits,
          timestamp: now
        });
      }

      // Analyze the website and extract specific issues
      const analysis = analyzeWebsite(cacheDoc.exists ? cacheDoc.data().audits : null, currentScores);

      // Calculate optimized scores based on actual issues found
      const optimizedScores = {
        performance: Math.min(100, currentScores.performance + analysis.performanceGain),
        accessibility: Math.min(100, currentScores.accessibility + analysis.accessibilityGain),
        seo: Math.min(100, currentScores.seo + analysis.seoGain),
        bestPractices: Math.min(100, currentScores.bestPractices + analysis.bestPracticesGain)
      };

      const avgImprovement = Math.round(
        ((optimizedScores.performance - currentScores.performance) +
         (optimizedScores.accessibility - currentScores.accessibility) +
         (optimizedScores.seo - currentScores.seo) +
         (optimizedScores.bestPractices - currentScores.bestPractices)) / 4
      );

      const improvements = {
        avgImprovement,
        loadTimeSaved: analysis.estimatedLoadTimeSaved,
        conversionBoost: Math.round(avgImprovement * 0.35) // Rough estimate
      };

      // Store test result
      const testRef = db.collection('pagespeed_tests').doc();
      const testId = testRef.id;

      await testRef.set({
        testId,
        url,
        email,
        currentScores,
        optimizedScores,
        improvements,
        issues: analysis.issues, // Store specific issues found
        timestamp: now,
        createdAt: new Date().toISOString()
      });

      // Store email lead
      await db.collection('leads').add({
        email,
        source: 'pagespeed_test',
        testId,
        url,
        timestamp: now,
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        testId,
        data: {
          url,
          currentScores,
          optimizedScores,
          improvements,
          issues: analysis.issues
        }
      };

    } catch (error) {
      console.error('PageSpeed test error:', error);
      throw new HttpsError('internal', `Failed to test website: ${error.message}`);
    }
  }
);

// Get PageSpeed test results by ID (for shareable links)
exports.getPageSpeedResult = onCall(
  async (request) => {
    const { testId } = request.data;

    if (!testId) {
      throw new HttpsError('invalid-argument', 'Test ID is required');
    }

    try {
      const testDoc = await db.collection('pagespeed_tests').doc(testId).get();

      if (!testDoc.exists) {
        throw new HttpsError('not-found', 'Test result not found');
      }

      return {
        success: true,
        data: testDoc.data()
      };

    } catch (error) {
      console.error('Get PageSpeed result error:', error);
      throw new HttpsError('internal', `Failed to retrieve test result: ${error.message}`);
    }
  }
);
