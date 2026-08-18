const ACCESS_CODE_HASH = "44b350ed060a41a1af57c7d07ed0aca3039777404d3a09d0380e68b6977d9874";
const BOOKINGS_KEY = "bookings";
const MAX_BODY_SIZE = 1024 * 1024;

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

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/api/bookings" && request.method === "GET") {
        requireApiAccess(request);
        return jsonResponse(await readBookings(env));
      }

      if (url.pathname === "/api/bookings" && request.method === "PUT") {
        requireApiAccess(request);
        const bookings = normalizeBookings(await readJsonBody(request));
        await env.BOOKINGS_KV.put(BOOKINGS_KEY, JSON.stringify(bookings));
        return jsonResponse(bookings);
      }

      if (url.pathname === "/api/health" && request.method === "GET") {
        return jsonResponse({ ok: true });
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof Response) return error;
      return jsonResponse({ error: "Server error" }, 500);
    }
  },
};

async function readBookings(env) {
  const storedBookings = await env.BOOKINGS_KV.get(BOOKINGS_KEY, "json");
  return normalizeBookings(storedBookings || []);
}

async function readJsonBody(request) {
  const body = await request.text();
  if (body.length > MAX_BODY_SIZE) {
    throw jsonResponse({ error: "Request body is too large" }, 413);
  }

  try {
    return JSON.parse(body || "[]");
  } catch {
    throw jsonResponse({ error: "Invalid JSON" }, 400);
  }
}

function requireApiAccess(request) {
  if (request.headers.get("X-Access-Code-Hash") === ACCESS_CODE_HASH) return;

  throw jsonResponse({ error: "Unauthorized" }, 401);
}

function normalizeBookings(value) {
  const rawBookings = Array.isArray(value) ? value : value?.bookings;
  if (!Array.isArray(rawBookings)) return [];

  return rawBookings
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

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function isISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createId() {
  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
