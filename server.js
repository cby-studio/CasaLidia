const fs = require("fs/promises");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const ACCESS_CODE_HASH =
  process.env.ACCESS_CODE_HASH ||
  "44b350ed060a41a1af57c7d07ed0aca3039777404d3a09d0380e68b6977d9874";
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const MAX_BODY_SIZE = 1024 * 1024;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const ROOMS = new Set([
  "room-1",
  "room-2",
  "room-3",
  "room-4",
  "room-5",
  "room-6",
  "room-7",
  "casuta",
]);

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/api/bookings" && request.method === "GET") {
      requireApiAccess(request);
      await sendJson(response, 200, await readBookings());
      return;
    }

    if (request.url === "/api/bookings" && request.method === "PUT") {
      requireApiAccess(request);
      const body = await readRequestBody(request);
      const bookings = normalizeBookings(JSON.parse(body));
      await writeBookings(bookings);
      await sendJson(response, 200, bookings);
      return;
    }

    if (request.url === "/api/health" && request.method === "GET") {
      await sendJson(response, 200, { ok: true });
      return;
    }

    await serveStaticFile(request, response);
  } catch (error) {
    const status = error.status || 500;
    await sendJson(response, status, { error: status === 500 ? "Server error" : error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Casa Lidia is running at http://${HOST}:${PORT}`);
});

function requireApiAccess(request) {
  if (request.headers["x-access-code-hash"] === ACCESS_CODE_HASH) return;

  const error = new Error("Unauthorized");
  error.status = 401;
  throw error;
}

async function readBookings() {
  try {
    const contents = await fs.readFile(BOOKINGS_FILE, "utf8");
    return normalizeBookings(JSON.parse(contents));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeBookings(bookings) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporaryFile = `${BOOKINGS_FILE}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(bookings, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, BOOKINGS_FILE);
}

async function readRequestBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > MAX_BODY_SIZE) {
      const error = new Error("Request body is too large");
      error.status = 413;
      throw error;
    }
  }

  return body || "[]";
}

function normalizeBookings(value) {
  if (!Array.isArray(value)) {
    const error = new Error("Bookings must be an array");
    error.status = 400;
    throw error;
  }

  return value
    .map((booking) => ({
      id: String(booking.id || createId()),
      roomId: String(booking.roomId || ""),
      startDate: String(booking.startDate || ""),
      endDate: String(booking.endDate || ""),
      guestName: String(booking.guestName || "").trim(),
      phone: String(booking.phone || "").trim(),
      people: Number(booking.people) || 1,
      notes: String(booking.notes || "").trim(),
    }))
    .filter(
      (booking) =>
        ROOMS.has(booking.roomId) &&
        isISODate(booking.startDate) &&
        isISODate(booking.endDate) &&
        booking.endDate >= booking.startDate &&
        booking.guestName,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

async function serveStaticFile(request, response) {
  const requestPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    await sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=60",
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

async function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function isISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createId() {
  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
