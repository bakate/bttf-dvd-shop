# Security

The app prices a cart from plain text. It has no accounts, no database, no
secret and no outbound request, so its attack surface is one public
endpoint (`POST /api/cart/price`), the health check, the API documentation
and the static frontend. This note maps each risk of the
[OWASP Top 10 (2025)](https://owasp.org/Top10/2025/) to what the project does
about it, and says which categories do not apply.

## OWASP Top 10 (2025)

| Risk                                       | Status         | Measure                                                                                                                                                                                                                                                                                                                         |
| :----------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 Broken Access Control                  | Not applicable | No user, role or resource owned by anyone: every caller may price a cart. The API makes no outbound request, so it cannot be used for SSRF. CORS is off unless `CORS_ORIGIN` names one allowed origin, since the page and the API share one origin (ADR 0015), and `frame-ancestors 'none'` stops the page being framed.        |
| A02 Security Misconfiguration              | Covered        | Helmet sends a strict Content Security Policy (`'self'` only, no inline script) and the standard security headers. The configuration is a Zod schema checked at startup, so a bad variable stops the process instead of running it half-configured. The container runs as the non-root `node` user.                             |
| A03 Software Supply Chain Failures         | Covered        | `pnpm install --frozen-lockfile` everywhere, a blocking `pnpm audit` in the quality gate (ADR 0002), weekly Dependabot updates, GitHub Actions pinned to a commit SHA, and the base image pinned by tag and digest (ADR 0015).                                                                                                  |
| A04 Cryptographic Failures                 | Not applicable | No password, token, personal data or stored data to protect. HTTPS is terminated by the host (Render).                                                                                                                                                                                                                          |
| A05 Injection                              | Covered        | No database, shell or template engine receives input. The basket is parsed once by a Zod schema at the HTTP boundary and read as text only. React escapes every rendered value, and the CSP blocks inline and third-party scripts.                                                                                              |
| A06 Insecure Design                        | Covered        | Every pricing rule lives on the server (ADR 0006), and expected failures are typed `Result` values with stable codes (ADR 0012). Abuse is bounded by design: 16 KB body, 500 lines, 200 characters per line, and a configurable rate limit per client (`API_RATE_LIMIT_*`).                                                     |
| A07 Authentication Failures                | Not applicable | No authentication: the app has no accounts or sessions.                                                                                                                                                                                                                                                                         |
| A08 Software or Data Integrity Failures    | Covered        | JSON is the only body parser, and the parsed body is validated before use. The generated OpenAPI document and frontend types are checked against the code in CI (`check:api-contract`). `main` is protected by the quality gate, and the demo is deployed from it.                                                              |
| A09 Security Logging and Alerting Failures | Partly covered | Structured pino JSON logs with a request id, returned in `X-Request-Id`. An allowlist keeps headers, cookies and the basket out of the logs. A server error and a fatal crash are logged with their stack (ADR 0013). No alerting: a monitoring service plugs into `reportError` on the frontend, and into the logs on the API. |
| A10 Mishandling of Exceptional Conditions  | Covered        | A global filter turns every error into an RFC 9457 problem; an unknown one is a generic 500 whose message and stack never reach the response. An error outside a request logs at `fatal` and exits, and the platform restarts the process (crash-only, ADR 0013). The screen never goes blank (ADR 0014).                       |

## Known limits

- Behind Render's proxy, every visitor of the demo shares one rate limit
  bucket, because `req.ip` is the proxy's address (ADR 0015).
- `style-src` allows `'unsafe-inline'`, because Mantine writes CSS
  variables in a `<style>` tag and in `style` attributes, which a nonce
  cannot cover (ADR 0015).
- The API documentation at `/api/docs` is public and has its own, looser
  policy, since Scalar loads its scripts from a CDN.
