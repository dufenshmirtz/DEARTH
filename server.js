const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT || 5177);
const MAX_PLAYERS = 12;
const BODY_LIMIT = 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

let players = [];
let hostState = null;

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

function createPlayer(name) {
  return {
    id: randomUUID ? randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: cleanName(name),
    guess: null,
    guessRound: 0,
    activeChoiceId: null,
    activeTargetId: null,
    activeRound: 0
  };
}

function resetRoom() {
  players = [];
  hostState = null;
}

function staticPathFor(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const resolved = path.resolve(ROOT, `.${requested}`);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

function serveStatic(request, response) {
  const filePath = staticPathFor(request.url);
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
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
}

async function handleApi(request, response) {
  if (request.method === "GET" && request.url === "/api/room") {
    sendJson(response, 200, { players, hostState });
    return;
  }

  if (request.method === "POST" && request.url === "/api/reset") {
    resetRoom();
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && request.url === "/api/host") {
    const body = await readBody(request);
    hostState = body.hostState || null;
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && request.url === "/api/join") {
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

  if (request.method === "POST" && request.url === "/api/remove") {
    const body = await readBody(request);
    const before = players.length;
    players = players.filter((player) => player.id !== body.id);
    sendJson(response, 200, { ok: true, removed: players.length !== before });
    return;
  }

  if (request.method === "POST" && request.url === "/api/player") {
    const body = await readBody(request);
    const player = players.find((candidate) => candidate.id === body.id);
    if (!player) {
      sendJson(response, 404, { ok: false, error: "Player not found" });
      return;
    }
    if (Number.isFinite(body.guess)) {
      player.guess = Math.ceil(Math.max(0, Math.min(100, body.guess)));
      player.guessRound = Number(body.guessRound || 0);
    }
    if (body.activeChoiceId) {
      player.activeChoiceId = String(body.activeChoiceId);
      player.activeTargetId = body.activeTargetId ? String(body.activeTargetId) : null;
      player.activeRound = Number(body.activeRound || 0);
    }
    sendJson(response, 200, { ok: true, player });
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

function localIpAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === "IPv4" && !network.internal)
    .map((network) => network.address);
}

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, "0.0.0.0", () => {
    const ips = localIpAddresses();
    console.log(`DEARTH host: http://localhost:${port}`);
    if (ips.length) {
      ips.forEach((ip) => console.log(`Phone URL: http://${ip}:${port}/controller.html`));
    } else {
      console.log(`Phone URL: http://localhost:${port}/controller.html`);
    }
  });
}

listen(START_PORT);
