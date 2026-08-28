// Minimal shared-secret auth for the admin API.
// The guard-facing /api/scan endpoint is intentionally open (guards should
// never need to log in mid-event), but every admin write/read endpoint
// requires this secret so only the event organizer can manage the code list.
export function isAdminRequest(request) {
  const provided = request.headers.get("x-admin-secret") || "";
  const expected = process.env.ADMIN_SECRET || "";
  if (!expected) return false;
  return timingSafeEqual(provided, expected);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
