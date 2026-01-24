import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * Embeddable JavaScript widget for monitor status
 * Returns a self-contained JS snippet that renders status on any website
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return generateErrorWidget("Monitor not found")
    }

    const monitor = monitorsSnapshot.docs[0].data()

    // Check if status page is enabled
    if (!monitor.statusPageEnabled) {
      return generateErrorWidget("Status page not enabled")
    }

    // Generate widget JavaScript
    const widget = generateWidgetScript(slug, monitor.name)

    return new NextResponse(widget, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=300, s-maxage=300", // Cache for 5 minutes
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Widget generation error:", error)
    return generateErrorWidget("Error loading widget")
  }
}

/**
 * Generate the widget JavaScript code
 */
function generateWidgetScript(slug: string, monitorName: string): string {
  return `
(function() {
  'use strict';
  
  // Configuration
  const SLUG = '${slug}';
  const API_BASE = window.location.origin;
  
  // Find the script tag that loaded this widget
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const containerId = currentScript.getAttribute('data-container') || 'cronguard-widget-' + SLUG;
  
  // Create container if it doesn't exist
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    currentScript.parentNode.insertBefore(container, currentScript);
  }
  
  // Styles
  const styles = \`
    .cronguard-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: white;
      max-width: 400px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .cronguard-widget-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .cronguard-widget-status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .cronguard-widget-status-dot.healthy { background: #10b981; }
    .cronguard-widget-status-dot.late { background: #eab308; }
    .cronguard-widget-status-dot.down { background: #ef4444; }
    .cronguard-widget-status-dot.paused { background: #6b7280; }
    .cronguard-widget-status-dot.pending { background: #3b82f6; }
    .cronguard-widget-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .cronguard-widget-status {
      font-size: 14px;
      color: #6b7280;
      margin: 4px 0 0 0;
    }
    .cronguard-widget-uptime {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
    }
    .cronguard-widget-link {
      margin-top: 12px;
      font-size: 12px;
    }
    .cronguard-widget-link a {
      color: #3b82f6;
      text-decoration: none;
    }
    .cronguard-widget-link a:hover {
      text-decoration: underline;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  \`;
  
  // Inject styles
  if (!document.getElementById('cronguard-widget-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'cronguard-widget-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
  
  // Fetch status data
  async function fetchStatus() {
    try {
      const response = await fetch(API_BASE + '/api/status/' + SLUG);
      const data = await response.json();
      renderWidget(data);
    } catch (error) {
      renderError('Failed to load status');
    }
  }
  
  // Render widget
  function renderWidget(data) {
    const status = data.monitor.status.toLowerCase();
    const statusText = getStatusText(status);
    const uptime30d = data.analytics.uptime.last30d.uptime.toFixed(2);
    
    container.innerHTML = \`
      <div class="cronguard-widget">
        <div class="cronguard-widget-header">
          <div class="cronguard-widget-status-dot \${status}"></div>
          <h3 class="cronguard-widget-title">\${data.monitor.statusPageTitle || data.monitor.name}</h3>
        </div>
        <p class="cronguard-widget-status">\${statusText}</p>
        <div class="cronguard-widget-uptime">
          30-day uptime: <strong>\${uptime30d}%</strong>
        </div>
        <div class="cronguard-widget-link">
          <a href="\${API_BASE}/status/\${SLUG}" target="_blank">View detailed status →</a>
        </div>
      </div>
    \`;
  }
  
  // Render error
  function renderError(message) {
    container.innerHTML = \`
      <div class="cronguard-widget">
        <p style="color: #ef4444; margin: 0;">\${message}</p>
      </div>
    \`;
  }
  
  // Get status text
  function getStatusText(status) {
    const texts = {
      healthy: 'All Systems Operational',
      late: 'Degraded Performance',
      down: 'System Down',
      paused: 'Monitoring Paused',
      pending: 'Waiting for First Check'
    };
    return texts[status] || 'Unknown Status';
  }
  
  // Initialize
  fetchStatus();
  
  // Auto-refresh every 60 seconds
  setInterval(fetchStatus, 60000);
})();
`.trim()
}

/**
 * Generate error widget
 */
function generateErrorWidget(message: string): NextResponse {
  const script = `
(function() {
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const container = document.createElement('div');
  container.style.cssText = 'padding: 16px; border: 1px solid #fee; background: #fef2f2; color: #dc2626; border-radius: 8px; font-family: sans-serif;';
  container.textContent = '${message}';
  currentScript.parentNode.insertBefore(container, currentScript);
})();
  `.trim()

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

