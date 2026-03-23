const liveMonitor = require('./live-monitor');
const http = require('http');
const os = require('os');

const routes = {
  '/chain': { host: 'webkurier-chain', port: 3001 },
  '/security': { host: 'webkurier-security', port: 3002 },
  '/phone': { host: 'webkurier-phonecore', port: 3003 },
  '/drone': { host: 'webkurier-dronehybrid', port: 3004 },
  '/site': { host: 'webkurier-site', port: 3005 }
};

const homePage = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>WebKurierCore</title>
<style>
body{font-family:Arial,sans-serif;background:#111;color:#eee;padding:40px}
h1{color:#4da3ff}
a{color:#7fd1ff;text-decoration:none}
.card{border:1px solid #333;padding:16px;margin:10px 0;border-radius:10px;background:#1a1a1a}
</style>
</head>
<body>
<h1>WebKurierCore</h1>
<div class="card"><a href="/admin">Open Hybrid Control Panel</a></div>
<div class="card"><a href="/chain">Chain</a></div>
<div class="card"><a href="/security">Security</a></div>
<div class="card"><a href="/phone">PhoneCore</a></div>
<div class="card"><a href="/drone">DroneHybrid</a></div>
<div class="card"><a href="/site">Site</a></div>
</body>
</html>`;

const adminPage = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>WebKurier Hybrid Control Panel</title>
<style>
body{font-family:Arial,sans-serif;background:#111;color:#eee;padding:32px}
h1,h2{color:#4da3ff}
a{color:#7fd1ff;text-decoration:none}
.card{border:1px solid #333;padding:16px;margin:12px 0;border-radius:12px;background:#1a1a1a}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
pre{background:#0d1117;border:1px solid #333;padding:12px;border-radius:10px;white-space:pre-wrap;overflow:auto}
button{background:#1f6feb;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer}
table{width:100%;border-collapse:collapse}
td,th{border-bottom:1px solid #333;padding:8px;text-align:left;vertical-align:top}
.small{color:#aaa;font-size:13px}
</style>
</head>
<body>
<h1>WebKurier Hybrid Control Panel</h1>

<div class="grid">
  <div class="card">
    <h2>Routes</h2>
    <div><a href="/">Core</a></div>
    <div><a href="/chain">Chain</a></div>
    <div><a href="/security">Security</a></div>
    <div><a href="/phone">PhoneCore</a></div>
    <div><a href="/drone">DroneHybrid</a></div>
    <div><a href="/site">Site</a></div>
  </div>

  <div class="card">
    <h2>System APIs</h2>
    <div><a href="/status">/status</a></div>
    <div><a href="/host-status">/host-status</a></div>
    <div><a href="/containers">/containers</a></div>
  </div>

  <div class="card">
    <h2>All 10 repositories</h2>
    <div>WebKurierHybrid — orchestrator</div>
    <div>WebKurierCore — central entry</div>
    <div>WebKurierDroneHybrid — domain core</div>
    <div>WebKurierChain — domain core</div>
    <div>WebKurierSecurity — domain core</div>
    <div>WebKurierPhoneCore — domain core</div>
    <div>WebKurierPhone-iOS — mobile client</div>
    <div>WebKurierPhone-Android — mobile client</div>
    <div>WebKurierSite — public layer</div>
    <div>WebKurierX — reserve future projects</div>
  </div>
</div>

<div class="card">
  <h2>Service Status</h2>
  <button onclick="loadStatus()">Refresh</button>
  <pre id="statusBox">Loading...</pre>
</div>

<div class="card">
  <h2>Host Status</h2>
  <button onclick="loadHostStatus()">Refresh</button>
  <pre id="hostBox">Loading...</pre>
</div>

<div class="card">
  <h2>Live Monitor</h2>
  <button onclick="loadLiveStats()">Refresh</button>
  <pre id="liveBox">Loading...</pre>
</div>

<div class="card">
  <h2>Docker Containers</h2>
  <button onclick="loadContainers()">Refresh</button>
  <div class="small">Logs and restart are wired to the live backend.</div>
  <div id="containersBox">Loading...</div>
</div>

<div class="card">
  <h2>Logs Viewer</h2>
  <pre id="logsBox">Select "Logs" on a container.</pre>
</div>

<script>
async function loadStatus() {
  const r = await fetch('/status');
  const j = await r.json();
  document.getElementById('statusBox').textContent = JSON.stringify(j, null, 2);
}

async function loadHostStatus() {
  const r = await fetch('/host-status');
  const j = await r.json();
  document.getElementById('hostBox').textContent = JSON.stringify(j, null, 2);
}

async function showLogs(name) {
  const r = await fetch('/logs/' + encodeURIComponent(name));
  const t = await r.text();
  document.getElementById('logsBox').textContent = t || '(empty logs)';
}

async function restartContainer(name) {
  const ok = confirm('Restart container: ' + name + '?');
  if (!ok) return;
  const r = await fetch('/restart/' + encodeURIComponent(name));
  const j = await r.json();
  alert(JSON.stringify(j, null, 2));
  await loadContainers();
  await loadStatus();
}

async function loadContainers() {
  const r = await fetch('/containers');
  const data = await r.json();
  const box = document.getElementById('containersBox');

  if (data.error) {
    box.innerHTML = '<pre>' + data.error + '</pre>';
    return;
  }

  const arr = Array.isArray(data) ? data : (data.containers || []);
  let html = '<table><tr><th>Name</th><th>Image</th><th>State</th><th>Ports</th><th>Actions</th></tr>';
  for (const c of arr) {
    const name = (c.Names && c.Names[0]) ? c.Names[0].replace(/^\\//,'') : (c.name || '');
    const image = c.Image || c.image || '';
    const state = c.State || c.Status || c.status || '';
    let ports = '';
    if (Array.isArray(c.Ports)) {
      ports = c.Ports.map(p => {
        const pub = p.PublicPort ? p.PublicPort : '';
        const priv = p.PrivatePort ? p.PrivatePort : '';
        return pub && priv ? pub + '->' + priv : JSON.stringify(p);
      }).join(', ');
    } else {
      ports = c.ports || '';
    }
    html += '<tr>'
      + '<td>' + name + '</td>'
      + '<td>' + image + '</td>'
      + '<td>' + state + '</td>'
      + '<td>' + ports + '</td>'
      + '<td>'
      + '<button onclick="showLogs(\\'' + name + '\\')">Logs</button> '
      + '<button onclick="restartContainer(\\'' + name + '\\')">Restart</button>'
      + '</td>'
      + '</tr>';
  }
  html += '</table>';
  box.innerHTML = html;
}

async function loadLiveStats() {
  const r = await fetch('/live-stats');
  const j = await r.json();
  document.getElementById('liveBox').textContent = JSON.stringify(j, null, 2);
}


loadStatus();
loadHostStatus();
loadLiveStats();
loadContainers();

setInterval(() => {
  loadLiveStats();
  loadContainers();
}, 5000);

</script>
</body>
</html>`;

function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function uptimeToHuman(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d + 'd ' + h + 'h ' + m + 'm';
}

function checkService(name, host, port) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: host, port: port, path: '/', method: 'GET', timeout: 1500 },
      (res) => resolve({ name: name, status: res.statusCode === 200 ? 'running' : 'error' })
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ name: name, status: 'timeout' });
    });
    req.on('error', () => resolve({ name: name, status: 'down' }));
    req.end();
  });
}

function dockerApi(path, method = 'GET') {
  return new Promise((resolve) => {
    const req = http.request(
      { socketPath: '/var/run/docker.sock', path, method },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve({ statusCode: res.statusCode, data: JSON.parse(data || '[]') }); }
          catch { resolve({ statusCode: res.statusCode, data }); }
        });
      }
    );
    req.on('error', err => resolve({ statusCode: 500, error: err.message }));
    req.end();
  });
}

http.createServer(async (req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(homePage);
  }

  if (req.url === '/admin') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(adminPage);
  }

  if (req.url === '/status') {
    const checks = await Promise.all([
      checkService('chain', 'webkurier-chain', 3001),
      checkService('security', 'webkurier-security', 3002),
      checkService('phone', 'webkurier-phonecore', 3003),
      checkService('drone', 'webkurier-dronehybrid', 3004),
      checkService('site', 'webkurier-site', 3005)
    ]);
    const result = { core: 'running' };
    for (const c of checks) result[c.name] = c.status;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(result, null, 2));
  }

  
  if (req.url === '/live-stats') {
    const stats = await liveMonitor.getLiveStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(stats, null, 2));
  }

if (req.url === '/host-status') {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const result = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: uptimeToHuman(os.uptime()),
      cpu_cores: os.cpus().length,
      loadavg: os.loadavg(),
      memory: {
        total_gb: bytesToGB(totalMem),
        used_gb: bytesToGB(usedMem),
        free_gb: bytesToGB(freeMem)
      }
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(result, null, 2));
  }

  if (req.url === '/containers') {
    const result = await dockerApi('/containers/json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(result.data || result, null, 2));
  }

  if (req.url.startsWith('/logs/')) {
    const name = decodeURIComponent(req.url.replace('/logs/', ''));
    const result = await dockerApi('/containers/' + name + '/logs?stdout=1&stderr=1&tail=100');
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2));
  }

  if (req.url.startsWith('/restart/')) {
    const name = decodeURIComponent(req.url.replace('/restart/', ''));
    const result = await dockerApi('/containers/' + name + '/restart', 'POST');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: result.statusCode === 204, statusCode: result.statusCode }, null, 2));
  }

  const target = routes[req.url];
  if (!target) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found\n');
  }

  const proxyReq = http.request(
    { hostname: target.host, port: target.port, path: '/', method: 'GET' },
    (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode || 200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(data);
      });
    }
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Gateway error: ' + err.message + '\n');
  });

  proxyReq.end();
}).listen(3000, '0.0.0.0', () => {
  console.log('WebKurierCore gateway listening on 3000');
});
