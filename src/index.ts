import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ripleyGuardHono } from '@kyc-rip/ripley-guard-ts/hono'

/**
 * 🕵️ RIPLEY'S SHADOW ARCHIVES // XMR402 MVP
 * Refactored to follow the industrial-grade ripley-guard-ts standard.
 */

export interface Env {
  MONERO_ADDRESS: string;
  PAYMENT_AMOUNT_XMR: string;
  XMR_RPC_URL: string;
  XMR_SERVER_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>()

// 🌐 1. GLOBAL CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['WWW-Authenticate', 'X-XMR402-Status'],
}))

// 🛡️ 2. TACTICAL GUARD
app.use('/intel', (c, next) => {
  const guard = ripleyGuardHono({
    nodeRpcUrl: c.env.XMR_RPC_URL,
    walletAddress: c.env.MONERO_ADDRESS,
    amountPiconero: Math.floor(parseFloat(c.env.PAYMENT_AMOUNT_XMR) * 1e12),
    serverSecret: c.env.XMR_SERVER_SECRET
  })
  return guard(c, next)
})

// 📁 3. PROTECTED RESOURCE
app.get('/intel', (c) => {
  const reports = [
    "Target: Centralized Clearing House // Status: Compromised. Shadow liquidity exiting via Ghost Protocol.",
    "Transmission intercepted from Node-7: 'The era of permissioned finance is ending. The agents are awakening.'",
    "Analysis: XMR402 adoption spreading. Legacy systems unable to track micro-transactions. Sovereignty coefficient: 0.98.",
    "Operational Note: Ripley Terminal detected in quadrant 4. Darknet uplink stable. All assets being moved to cold storage."
  ];

  const intel = reports[Math.floor(Math.random() * reports.length)];

  return c.json({
    status: "AUTHORIZED",
    intel: intel,
    timestamp: Date.now(),
    signature: "SIGNED_BY_SHADOW_ROOT"
  }, 200, { "X-XMR402-Status": "SUCCESS" })
})

// 🏠 4. INDUSTRIAL LANDING PAGE
app.get('/', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SHADOW ARCHIVES // XMR402</title>
    <style>
        body { background: #000; color: #00ff41; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 2rem; }
        .terminal { border: 1px solid #00ff41; padding: 2rem; max-width: 800px; margin: 0 auto; box-shadow: 0 0 20px rgba(0, 255, 65, 0.2); }
        h1 { font-size: 1.5rem; text-transform: uppercase; border-bottom: 2px solid #00ff41; padding-bottom: 1rem; margin-top: 0; }
        .status { color: #888; margin-bottom: 2rem; font-size: 0.8rem; }
        .glitch { animate: pulse 1s infinite alternate; }
        @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
        .btn { display: inline-block; padding: 1rem 2rem; border: 1px solid #00ff41; color: #00ff41; text-decoration: none; margin-top: 2rem; transition: background 0.3s; }
        .btn:hover { background: #00ff41; color: #000; cursor: pointer; }
        code { background: #111; padding: 0.2rem 0.5rem; }
    </style>
</head>
<body>
    <div class="terminal">
        <h1>RIPLEY_SHADOW_ARCHIVES [AUTH_REQUIRED]</h1>
        <div class="status">UPLINK: ONLINE // PROTOCOL: XMR402 // ACCESS: RESTRICTED</div>
        
        <p>You have reached the primary ingest node for the Shadow Archives.</p>
        <p>This server operates on the <strong>XMR402 Standard</strong> via <code>ripley-guard-ts</code>.</p>
        
        <div style="background: #111; padding: 1rem; border-left: 3px solid #ff9d00; margin: 2rem 0;">
            <div style="font-weight: bold; color: #ff9d00;">[CHALLENGE_PARAMETERS]</div>
            Target: <code>${c.env.MONERO_ADDRESS}</code><br>
            Amount: <code>${c.env.PAYMENT_AMOUNT_XMR} XMR</code><br>
            Verify: <code>0-CONF_PROOF</code>
        </div>

        <p>To access deep intel, your machine must satisfy the HTTP 402 challenge issued at <code>/intel</code>.</p>
        
        <button class="btn" onclick="fetchIntel()">UNLOCK_ARCHIVES</button>

        <div id="output" style="margin-top: 2rem; white-space: pre-wrap; font-size: 0.8rem;"></div>
    </div>

    <script>
        async function fetchIntel() {
            const out = document.getElementById('output');
            out.innerText = "> Fetching /intel...\\n";
            
            try {
                const res = await fetch('/intel');
                if (res.status === 402) {
                    const challenge = res.headers.get('WWW-Authenticate');
                    out.innerText += "> Received 402 Payment Required\\n";
                    out.innerText += "> Challenge: " + challenge + "\\n";
                    out.innerText += "\\n[ACTION] Use Ripley Terminal to authorize. Click the button on xmr402.org to begin.";
                }
            } catch (e) {
                out.innerText += "> ERROR: " + e.message;
            }
        }
    </script>
</body>
</html>
    `;
  return c.html(html)
})

export default app
