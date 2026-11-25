// Mantine writes its CSS variables in style tags and attributes, which a nonce cannot cover (ADR 0015).
export const webAppContentSecurityPolicy = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
  "script-src": ["'self'"],
  "script-src-attr": ["'none'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'"],
  "img-src": ["'self'"],
  "connect-src": ["'self'"],
} as const satisfies Record<string, readonly string[]>;
