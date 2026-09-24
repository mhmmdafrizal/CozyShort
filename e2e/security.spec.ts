import { expect, test } from "@playwright/test";

test.describe("API security", () => {
  test("rejects requests without a url", async ({ request }) => {
    const res = await request.get("/api/shorten");
    expect(res.status()).toBe(400);
  });

  test("rejects non-http(s) schemes before proxying", async ({ request }) => {
    for (const bad of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:text/html,<script>alert(1)</script>",
      "ftp://example.com",
    ]) {
      const res = await request.get(`/api/shorten?url=${encodeURIComponent(bad)}`);
      expect(res.status(), bad).toBe(400);
    }
  });

  test("accepts http/https", async ({ request }) => {
    // hits real TinyURL; tolerant because it's an uptime-dependent third party
    const res = await request.get("/api/shorten?url=https://example.com");
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
  });
});

test.describe("Security headers", () => {
  test("homepage sends hardening headers and a CSP", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);

    for (const [header, expected] of [
      ["x-content-type-options", "nosniff"],
      ["x-frame-options", "DENY"],
      ["referrer-policy", "strict-origin-when-cross-origin"],
      ["permissions-policy", /camera=\(\)/],
    ] as const) {
      const value = res.headers()[header];
      expect(value, header).toBeTruthy();
      if (typeof expected === "string") expect(value).toContain(expected);
      else expect(value).toMatch(expected);
    }

    const csp = res.headers()["content-security-policy"];
    expect(csp, "content-security-policy").toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
  });
});