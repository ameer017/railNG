export function homeForRole(role: "ADMIN" | "PASSENGER" | string | undefined) {
  if (role === "ADMIN") return "/admin";
  return "/dashboard";
}

export function firstName(name?: string | null) {
  const value = name?.trim();
  if (!value) return "there";
  return value.split(/\s+/)[0] ?? "there";
}

function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function resolvePostAuthPath(
  role: "ADMIN" | "PASSENGER" | string | undefined,
  callbackUrl?: string | null,
) {
  const home = homeForRole(role);
  if (!callbackUrl || callbackUrl === "/" || !isSafePath(callbackUrl)) {
    return home;
  }

  if (role === "ADMIN") {
    if (!callbackUrl.startsWith("/admin")) return home;
    return callbackUrl;
  }

  if (callbackUrl.startsWith("/admin")) return home;
  return callbackUrl;
}

export function bookingHref(booking: { status: string; id: string; reference: string }) {
  if (booking.status === "PAID") return `/ticket/${booking.reference}`;
  if (booking.status === "PENDING") return `/checkout/${booking.id}`;
  return "/bookings";
}
