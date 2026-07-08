import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ripleyGuardHono } from '@kyc-rip/ripley-guard-ts/hono'
import { ripleyGuardWS } from '@kyc-rip/ripley-guard-ts/ws/adapter'

/**
 * 🕵️ RIPLEY'S SHADOW ARCHIVES // XMR402 MVP v2.0
 * High-performance, transport-agnostic payment gateway.
 * Strictly 0-conf and English-only codebase.
 */

export interface Env {
  MONERO_ADDRESS: string;
  PAYMENT_AMOUNT_XMR: string;
  XMR_RPC_URL: string;
  XMR_SERVER_SECRET: string;
  // Optional Cloudflare Access service-token creds for a gated wallet-RPC.
  // Set BOTH as Worker secrets when XMR_RPC_URL sits behind Cloudflare Access.
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
}

const app = new Hono<{ Bindings: Env }>()

/** Build the wallet-RPC auth headers. When XMR_RPC_URL is behind Cloudflare Access,
 *  a service token (created in the Access dashboard, added to the RPC's policy) lets
 *  the Worker through. Returns {} when unset — a no-op for a public/unguarded RPC. */
function rpcHeaders(env: Env): Record<string, string> {
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    return {
      'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET
    };
  }
  return {};
}

// 🌐 1. GLOBAL CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  exposeHeaders: ['WWW-Authenticate', 'X-XMR402-Status'],
}))

// 🛡️ 2. TACTICAL GUARD (HTTP 402 Flow)
app.use('/intel', async (c, next) => {
  const guard = ripleyGuardHono({
    nodeRpcUrl: c.env.XMR_RPC_URL,
    walletAddress: c.env.MONERO_ADDRESS,
    amountPiconero: Math.floor(parseFloat(c.env.PAYMENT_AMOUNT_XMR) * 1e12),
    serverSecret: c.env.XMR_SERVER_SECRET,
    rpcHeaders: rpcHeaders(c.env)
  })
  return await guard(c, next)
})

// 📁 3. PROTECTED RESOURCE
app.get('/intel', (c) => {
  return c.json({
    status: "AUTHORIZED",
    intel: "Transmission intercepted: 'Sovereignty is the default state of the machine economy.'",
    timestamp: Date.now(),
    protocol: "XMR402 v2.0"
  }, 200, { "X-XMR402-Status": "SUCCESS" })
})

// 🔌 4. WEBSOCKET RELAY (Extreme DX Adapter)
app.get('/relay', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426)
  }

  // @ts-ignore - Cloudflare Worker WebSocketPair
  const [client, server] = new WebSocketPair()

  const gate = ripleyGuardWS({
    nodeRpcUrl: c.env.XMR_RPC_URL,
    walletAddress: c.env.MONERO_ADDRESS,
    serverSecret: c.env.XMR_SERVER_SECRET,
    rpcHeaders: rpcHeaders(c.env)
  })

  const amount = Math.floor(parseFloat(c.env.PAYMENT_AMOUNT_XMR) * 1e12)

  server.accept()
  server.addEventListener('message', async (event: { data: string }) => {
    try {
      // One-liner authorization using the v2.0 adapter
      await gate.handle(server, event.data, 'cf-worker-node', amount, (intent) => {
        server.send(JSON.stringify({
          type: 'ACCESS_GRANTED',
          intent,
          secret: "GHOST_PROTOCOL_ACTIVE_V2"
        }))
        // Close our side cleanly once access is granted. In a plain Worker a socket left
        // open after the handshake is flagged as a hung request and force-canceled, which
        // surfaces to the client as an abnormal close. The exchange is complete here.
        try { server.close(1000, 'granted') } catch { /* already closing */ }
      })
    } catch (e: any) {
      // Defensive: never let a handler throw hang the socket — surface it as an ERROR frame.
      try { server.send(JSON.stringify({ type: 'ERROR', message: `HANDLER_ERROR: ${e?.message || e}` })) } catch { /* socket gone */ }
    }
  })

  // @ts-ignore - Cloudflare Response extension
  return new Response(null, { status: 101, webSocket: client })
})

// 🏠 5. LANDING PAGE
app.get('/', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SHADOW ARCHIVES // XMR402 v2.0</title>
    <style>
        body { background: #000; color: #00ff41; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 2rem; border-top: 4px solid #00ff41; }
        .terminal { border: 1px solid #333; padding: 2rem; max-width: 900px; margin: 0 auto; background: #050505; }
        h1 { font-size: 1.8rem; letter-spacing: 2px; border-bottom: 1px solid #333; padding-bottom: 1rem; }
        .badge { background: #00ff41; color: #000; padding: 0.2rem 0.6rem; font-weight: bold; font-size: 0.7rem; vertical-align: middle; }
        .status-line { color: #888; font-size: 0.8rem; margin: 1rem 0 2rem; border-left: 2px solid #00ff41; padding-left: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
        .box { border: 1px solid #222; padding: 1.5rem; background: #080808; }
        .box h3 { margin-top: 0; color: #fff; text-transform: uppercase; font-size: 0.9rem; }
        .btn { display: inline-block; padding: 0.8rem 1.5rem; border: 1px solid #00ff41; color: #00ff41; text-decoration: none; transition: 0.3s; background: transparent; font-family: inherit; font-weight: bold; }
        .btn:hover { background: #00ff41; color: #000; cursor: pointer; }
    </style>
</head>
<body>
    <div class="terminal">
        <h1>SHADOW_ARCHIVES <span class="badge">v2.0.0</span></h1>
        <div class="status-line">
            UPLINK: CLOUDFLARE_WORKER // TARGET: ${c.env.MONERO_ADDRESS} // AGNOSTIC_MODE: ENABLED
        </div>
        
        <p>This ingest node operates under the <strong>XMR402 v2.0</strong> specification.</p>

        <div class="grid">
            <div class="box">
                <h3>HTTP Gate (v2.0)</h3>
                <p>Standard IETF flow with intent-bound HMAC protection.</p>
                <div style="margin-top: 1rem;">
                    <button class="btn" onclick="testHttp()">TEST_HTTP</button>
                </div>
            </div>
            <div class="box">
                <h3>WS Relay (v2.0)</h3>
                <p>Ultra-low latency JSON frames for P2P agent streams.</p>
                <div style="margin-top: 1rem;">
                    <button class="btn" onclick="testWS()">TEST_WS_RELAY</button>
                </div>
            </div>
        </div>

        <div id="output" style="margin-top: 2rem; padding: 1rem; background: #111; font-size: 0.8rem; color: #888; white-space: pre-wrap;">- TERMINAL IDLE -</div>
    </div>

    <script>
        const out = document.getElementById('output');
        function log(msg) { out.innerText += "> " + msg + "\\n"; }

        async function testHttp() {
            out.innerText = "";
            log("Intercepting /intel via HTTP...");
            const res = await fetch('/intel');
            if (res.status === 402) {
                log("CHALLENGE_RECEIVED: " + res.headers.get('WWW-Authenticate'));
                log("STATUS: Authorization required via Payload Binding.");
            }
        }

        async function testWS() {
            out.innerText = "";
            log("Initiating WS Relay handshake...");
            const socket = new WebSocket(location.origin.replace('http', 'ws') + '/relay');
            
            socket.onopen = () => {
                log("UPLINK_STABLE // Sending intent frame...");
                socket.send(JSON.stringify({ intent: "SOVEREIGN_REPUTATION" }));
            };

            socket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                log("FRAME_RECEIVED: " + data.type);
                if (data.type === 'PAYMENT_CHALLENGE') {
                    log("CHALLENGE_NONCE: " + data.message);
                }
            };
        }
    </script>
</body>
</html>
    `;
  return c.html(html)
})

export default app
