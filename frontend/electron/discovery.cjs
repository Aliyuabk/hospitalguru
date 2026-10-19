const http = require('node:http');
const { networkInterfaces } = require('node:os');

function ipv4Number(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return parts.reduce((value, part) => ((value << 8) | part) >>> 0, 0);
}

function ipv4String(value) {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

function candidatesOnLan() {
  const candidates = new Set();
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) {
      if ((entry.family !== 'IPv4' && entry.family !== 4) || entry.internal || !entry.netmask) continue;
      const ip = ipv4Number(entry.address);
      const mask = ipv4Number(entry.netmask);
      if (ip === null || mask === null) continue;
      const network = (ip & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const hostCount = broadcast - network - 1;
      if (hostCount < 1 || hostCount > 1022) continue;
      for (let address = network + 1; address < broadcast; address += 1) candidates.add(ipv4String(address >>> 0));
    }
  }
  return [...candidates];
}

function isBkdApi(address) {
  return new Promise((resolve) => {
    const request = http.get({ hostname: address, port: 8000, path: '/api/desktop-discovery', timeout: 550 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; if (body.length > 2048) request.destroy(); });
      response.on('end', () => {
        try { resolve(response.statusCode === 200 && JSON.parse(body).service === 'bkd-pharmacy-api'); }
        catch { resolve(false); }
      });
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function discoverApi() {
  const candidates = candidatesOnLan();
  let next = 0;
  let found = null;
  async function worker() {
    while (!found && next < candidates.length) {
      const address = candidates[next++];
      if (await isBkdApi(address)) found = `http://${address}:8000/api`;
    }
  }
  await Promise.all(Array.from({ length: Math.min(40, candidates.length) }, () => worker()));
  return found;
}

module.exports = { discoverApi };
