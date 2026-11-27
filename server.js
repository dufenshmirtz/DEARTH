// Local PvP server: serves the game and the phone controller, and passes the phones' guesses and
// ARTIFACT choices to the host screen. Zero dependencies.
// - `node server.js` (pnpm start, start_pvp_server.bat): the browser host at http://localhost:5177
// - the desktop app (desktop/main.cjs) starts it itself with startPvpServer() the first time PvP opens
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");

const DEFAULT_PORT = Number(process.env.PORT || 5177);
const MAX_PLAYERS = 12;
const BODY_LIMIT = 1024 * 1024;
// a phone that has not asked for the room for this long shows as disconnected on the host
const CONNECTED_MS = 5000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > BODY_LIMIT) {
        reject(new Error("Body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function cleanName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, 16);
  return name || "Player";
}

// The addresses a phone on the same Wi-Fi can open, best first: home/office networks (192.168.x,
// 10.x, 172.16-31.x) before others, and virtual adapters (VirtualBox, WSL, VPNs...) last.
function lanAddresses() {
  const virtual = /virtual|vmware|vbox|hyper-v|vethernet|wsl|docker|tailscale|zerotier|hamachi|loopback|tap|tun|utun|bridge/i;
  const privateRange = (ip) => /^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  const found = [];
  Object.entries(os.networkInterfaces()).forEach(([name, list]) => {
    (list || []).forEach((network) => {
      if (!network || network.family !== "IPv4" || network.internal) return;
      if (/^169\.254\./.test(network.address)) return; // no network (self-assigned)
      const score = (privateRange(network.address) ? 0 : 2) + (virtual.test(name) ? 4 : 0) + (/^192\.168\./.test(network.address) ? 0 : 1);
      found.push({ address: network.address, score });
    });
  });
  return found.sort((a, b) => a.score - b.score).map((entry) => entry.address);
}

function createPvpServer({ root = __dirname } = {}) {
  const ROOT = path.resolve(root);
  let players = [];
  let hostState = null;
  let listeningPort = null;

  function createPlayer(name) {
    return {
      id: randomUUID ? randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: cleanName(name),
      guess: null,
      guessGame: 0,
      guessRound: 0,
      activeChoiceId: null,
      activeTargetId: null,
      activeGame: 0,
      activeRound: 0,
      // icon rerolls: the phone counts its requests up; the host applies each new one once
      rerollSeq: 0,
      rerollKind: null,
      lastSeen: Date.now()
    };
  }

  function publicPlayers() {
    const now = Date.now();
    return players.map(({ lastSeen, ...player }) => ({ ...player, connected: now - lastSeen < CONNECTED_MS }));
  }

  function staticPathFor(urlPath) {
    const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
    const requested = cleanPath === "/" ? "/index.html" : cleanPath;
    const resolved = path.resolve(ROOT, `.${requested}`);
    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
    return resolved;
  }

  function serveStatic(request, response) {
    let filePath = null;
    try {
      filePath = staticPathFor(request.url);
    } catch {
      filePath = null;
    }
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(data);
    });
  }

  async function handleApi(request, response) {
    const url = new URL(request.url, "http://localhost");
    const route = url.pathname;

    if (request.method === "GET" && route === "/api/room") {
      // a phone sends its id with every poll, so the host can show who is still connected
      const seenId = url.searchParams.get("id");
      const seen = seenId && players.find((player) => player.id === seenId);
      if (seen) seen.lastSeen = Date.now();
      // serverNow: the phones compare the host's clock deadline with it (host and server share a computer)
      sendJson(response, 200, { players: publicPlayers(), hostState, serverNow: Date.now() });
      return;
    }

    if (request.method === "GET" && route === "/api/info") {
      const addresses = lanAddresses();
      sendJson(response, 200, {
        port: listeningPort,
        addresses,
        controllerUrls: addresses.map((address) => `http://${address}:${listeningPort}/controller.html`)
      });
      return;
    }

    if (request.method === "POST" && route === "/api/reset") {
      players = [];
      hostState = null;
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && route === "/api/host") {
      const body = await readBody(request);
      hostState = body.hostState || null;
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && route === "/api/join") {
      const body = await readBody(request);
      if (players.length >= MAX_PLAYERS) {
        sendJson(response, 409, { ok: false, error: "Room is full" });
        return;
      }
      const player = createPlayer(body.name);
      players.push(player);
      sendJson(response, 200, { ok: true, player });
      return;
    }

    if (request.method === "POST" && route === "/api/remove") {
      const body = await readBody(request);
      const before = players.length;
      players = players.filter((player) => player.id !== body.id);
      sendJson(response, 200, { ok: true, removed: players.length !== before });
      return;
    }

    if (request.method === "POST" && route === "/api/player") {
      const body = await readBody(request);
      const player = players.find((candidate) => candidate.id === body.id);
      if (!player) {
        sendJson(response, 404, { ok: false, error: "Player not found" });
        return;
      }
      player.lastSeen = Date.now();
      if (Number.isFinite(body.guess)) {
        player.guess = Math.ceil(Math.max(0, Math.min(100, body.guess)));
        player.guessGame = Number(body.guessGame || 0);
        player.guessRound = Number(body.guessRound || 0);
      }
      if (body.activeChoiceId) {
        player.activeChoiceId = String(body.activeChoiceId);
        player.activeTargetId = body.activeTargetId ? String(body.activeTargetId) : null;
        player.activeGame = Number(body.activeGame || 0);
        player.activeRound = Number(body.activeRound || 0);
      }
      if (Number.isFinite(body.rerollSeq) && body.rerollSeq > player.rerollSeq) {
        player.rerollSeq = body.rerollSeq;
        player.rerollKind = body.rerollKind === "archangel" ? "archangel" : "goetic";
      }
      const { lastSeen, ...shown } = player;
      sendJson(response, 200, { ok: true, player: shown });
      return;
    }

    sendJson(response, 404, { ok: false, error: "Unknown API route" });
  }

  const server = http.createServer((request, response) => {
    if (request.url.startsWith("/api/")) {
      handleApi(request, response).catch((error) => {
        sendJson(response, 400, { ok: false, error: error.message });
      });
      return;
    }
    serveStatic(request, response);
  });

  // listens on the first free port from `port` up; resolves with the port it got
  function listen(port = DEFAULT_PORT, attempts = 20) {
    return new Promise((resolve, reject) => {
      const tryPort = (candidate, left) => {
        const onError = (error) => {
          server.off("listening", onListening);
          if (error.code === "EADDRINUSE" && left > 0) tryPort(candidate + 1, left - 1);
          else reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          listeningPort = candidate;
          resolve(candidate);
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(candidate, "0.0.0.0");
      };
      tryPort(port, attempts);
    });
  }

  return {
    server,
    listen,
    get port() {
      return listeningPort;
    },
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

// Starts a server and resolves once it listens: { port, addresses, close() }.
async function startPvpServer({ root = __dirname, port = DEFAULT_PORT } = {}) {
  const pvp = createPvpServer({ root });
  const listeningPort = await pvp.listen(port);
  return { port: listeningPort, addresses: lanAddresses(), close: pvp.close, server: pvp.server };
}

module.exports = { startPvpServer, createPvpServer, lanAddresses };

if (require.main === module) {
  startPvpServer().then(({ port, addresses }) => {
    console.log(`DEARTH host: http://localhost:${port}`);
    if (addresses.length) {
      addresses.forEach((address) => console.log(`Phone URL: http://${address}:${port}/controller.html`));
    } else {
      console.log(`Phone URL: http://localhost:${port}/controller.html`);
    }
  });
}
