import { expect, test } from "@playwright/test";

const SHORT_URL = "https://tinyurl.com/abc123";

test.describe("URL shortener UI", () => {
  test.beforeEach(async ({ page }) => {
    // deterministic: intercept the proxy instead of calling TinyURL
    await page.route("**/api/shorten?*", (route) =>
      route.fulfill({ status: 200, body: SHORT_URL })
    );
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://localhost:3100",
    });
  });

  test("homepage renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CozyShort")).toBeVisible();
    await expect(page.getByRole("heading", { name: "URL Shortener" })).toBeVisible();
    await expect(page.getByPlaceholder("https://example.com/some/long/path")).toBeVisible();
  });

  test("shortens a URL, shows result, saves to history", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("https://example.com/some/long/path").fill("https://example.com/a-very-long-link");
    await page.getByRole("button", { name: "Shorten" }).click();

    const result = page.locator(".result-link");
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("href", SHORT_URL);

    // history entry appears
    await expect(page.getByText("Recent links")).toBeVisible();
    await expect(page.getByRole("link", { name: SHORT_URL }).first()).toBeVisible();

    // copy button works (clipboard permission is granted in headless chromium)
    await page.getByRole("button", { name: "Copy" }).click();
    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
  });

  test("rejects invalid input without calling the API", async ({ page }) => {
    let apiCalls = 0;
    await page.unroute("**/api/shorten?*");
    await page.route("**/api/shorten?*", (route) => {
      apiCalls++;
      return route.fulfill({ status: 200, body: SHORT_URL });
    });
    await page.goto("/");

    // empty submit
    await page.getByRole("button", { name: "Shorten" }).click();
    await expect(page.locator(".error-box")).toHaveText("Enter a URL first.");

    // javascript: and file: schemes are rejected client-side
    const input = page.getByPlaceholder("https://example.com/some/long/path");
    for (const bad of ["javascript:alert(1)", "file:///etc/passwd"]) {
      await input.fill(bad);
      await page.getByRole("button", { name: "Shorten" }).click();
      await expect(page.locator(".error-box")).toContainText("doesn't look like a valid URL");
    }
    expect(apiCalls).toBe(0);
  });

  test("clears history via the confirm dialog", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("https://example.com/some/long/path").fill("https://example.com/keep-or-clear");
    await page.getByRole("button", { name: "Shorten" }).click();
    await expect(page.getByText("Recent links")).toBeVisible();

    await page.getByTitle("Clear history").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Clear recent links?");

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Recent links")).toBeVisible(); // still there

    await page.getByTitle("Clear history").click();
    await page.getByRole("dialog").getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Recent links")).not.toBeVisible();
  });

  test("theme toggle switches dark/light", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", /light|dark/);

    await page.getByRole("button", { name: "Toggle theme" }).click();
    const after = await html.getAttribute("data-theme");
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(html).toHaveAttribute(
      "data-theme",
      after === "dark" ? "light" : "dark"
    );
  });
});