import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const host = '127.0.0.1';
const port = Number(process.env.CAMPFIRE_CAPTURE_PORT || 8765);
const workspace = process.cwd();
const outputFile = process.env.CAMPFIRE_CAPTURE_FILE || 'campfire_private_capture_direct.json';
const outputPath = path.join(workspace, outputFile);
const maxBodyBytes = 50 * 1024 * 1024;

function send(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/save') {
    send(res, 404, { ok: false, error: 'Use POST /save.' });
    return;
  }

  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxBodyBytes) {
      req.destroy(new Error('Request body too large.'));
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks).toString('utf8');
      const parsed = JSON.parse(body);
      fs.writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
      send(res, 200, {
        ok: true,
        outputPath,
        captured: parsed.captures?.length ?? 0,
        errors: parsed.errors?.length ?? 0,
        bytes: Buffer.byteLength(body),
      });
    } catch (error) {
      send(res, 400, { ok: false, error: String(error?.message || error) });
    }
  });

  req.on('error', (error) => {
    send(res, 500, { ok: false, error: String(error?.message || error) });
  });
});

server.listen(port, host, () => {
  console.log(`Campfire capture receiver listening at http://${host}:${port}/save`);
  console.log(`Writing captures to ${outputPath}`);
});
