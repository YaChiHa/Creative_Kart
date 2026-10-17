import { expect, test, type Page } from "@playwright/test";
import { watchForProblems } from "./helpers";

interface Manifest {
  name?: string;
  short_name?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  theme_color?: string;
  background_color?: string;
  icons?: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
}

/** Waits until a service worker is active and controls the page (reloads once if needed). */
async function waitForControlledPage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

test.describe("web app manifest", () => {
  test("is linked, complete and points at real icons of the declared size", async ({
    page,
    request,
  }) => {
    await page.goto("/");

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBeTruthy();
    const manifestUrl = new URL(manifestHref ?? "", page.url()).href;

    const response = await request.get(manifestUrl);
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as Manifest;

    expect(manifest.name).toBe("Aurelle");
    expect(manifest.short_name).toBe("Aurelle");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.scope).toBeTruthy();
    expect(manifest.theme_color).toBe("#171714");
    expect(manifest.background_color).toBe("#171714");

    const icons = manifest.icons ?? [];
    expect(icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable")).toBe(
      true,
    );

    for (const icon of icons) {
      const iconResponse = await request.get(new URL(icon.src, manifestUrl).href);
      expect(iconResponse.ok(), `${icon.src} should load`).toBe(true);
      if (icon.type === "image/png") {
        const png = await iconResponse.body();
        // A PNG stores its width and height as two 32-bit numbers at bytes 16 and 20.
        const declared = `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
        expect(declared, `${icon.src} real size`).toBe(icon.sizes);
      }
    }
  });

  test("favicon and Apple touch icon load", async ({ page, request }) => {
    await page.goto("/");
    for (const selector of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]']) {
      const href = await page.locator(selector).getAttribute("href");
      const response = await request.get(new URL(href ?? "", page.url()).href);
      expect(response.ok(), selector).toBe(true);
    }
  });
});

test.describe("service worker", () => {
  test("build step filled in the precache list and build id", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBe(true);
    const source = await response.text();

    expect(source).toMatch(/const BUILD_ID = "[0-9a-f]{12}";/);
    expect(source).not.toContain("/*BUILD_ID*/");
    expect(source).not.toContain("/*PRECACHE_URLS*/");
    expect(source).toContain('"./"');
    expect(source).toMatch(/"assets\/[^"]+\.js"/);
    expect(source).toMatch(/"assets\/[^"]+\.css"/);
    expect(source).toContain('"offline.html"');
    expect(source).not.toContain('"sw.js"');
  });

  test("installs, takes control and fills a versioned cache", async ({ page }) => {
    const problems = watchForProblems(page);
    await waitForControlledPage(page);

    const cache = await page.evaluate(async () => {
      const names = (await caches.keys()).filter((name) => name.startsWith("aurelle-shell-"));
      const name = names[0];
      const urls = name
        ? (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)
        : [];
      return { names, urls };
    });

    expect(cache.names).toHaveLength(1);
    expect(cache.urls).toContain("/");
    expect(cache.urls).toContain("/offline.html");
    expect(cache.urls.some((url) => url.startsWith("/assets/") && url.endsWith(".js"))).toBe(true);
    expect(cache.urls).not.toContain("/sw.js");
    expect(problems.pageErrors).toEqual([]);
    expect(problems.consoleErrors).toEqual([]);
  });

  test("does not cache or intercept requests outside the app shell", async ({ page }) => {
    await waitForControlledPage(page);
    await page.route("**/api/anything", (route) =>
      route.fulfill({ status: 200, body: "{}", contentType: "application/json" }),
    );
    await page.evaluate(() => fetch("/api/anything"));

    const cachedPaths = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        for (const request of await (await caches.open(name)).keys()) {
          urls.push(new URL(request.url).pathname);
        }
      }
      return urls;
    });
    expect(cachedPaths).not.toContain("/api/anything");
  });

  test("the app keeps working when service worker registration fails", async ({
    page,
    context,
  }) => {
    await context.route("**/sw.js", (route) => route.abort());
    const problems = watchForProblems(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discover something special.");
    expect(problems.pageErrors).toEqual([]);
  });
});
