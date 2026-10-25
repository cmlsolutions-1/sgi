function documentOrigins() {
  return [...new Set((process.env.CSP_DOCUMENT_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean).map(value => {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.origin !== value || url.username || url.password) throw new Error("CSP_DOCUMENT_ORIGINS must contain comma-separated HTTP(S) origins without paths");
    return url.origin;
  }))];
}

export function contentSecurityPolicy(nonce) {
  const production = process.env.NODE_ENV === "production";
  const documents = documentOrigins().join(" ");
  return [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}' 'strict-dynamic'` : ""}${production ? "" : " 'unsafe-eval'"}`,
    // Radix, Recharts and appearance controls require inline styles, not scripts.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${documents}`,
    "font-src 'self' data:",
    `connect-src 'self' ${production ? "" : "ws://localhost:* ws://127.0.0.1:*"} ${documents}`,
    `frame-src 'self' blob: data: ${documents}`,
    "object-src 'none'", "media-src 'self' blob: data:", "worker-src 'self' blob:",
    "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].map(value => value.trim()).join("; ");
}

export function securityHeaders() {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
  ];
}
