import { expect, test, type Page } from "@playwright/test";
import { startStaticServer } from "./helpers";

// These tests serve dist/ from their own throwaway server so they can really switch the
// network off (by stopping the server) and really ship a "new version".
// Run `npm run build` first; `npm run verify` does this for you.
const DIST = new URL("../dist/", import.meta.url);

async function installAndControl(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

test.describe("offline behaviour", () => {
  test("after one online visit the app still opens with no network", async ({ page }) => {
    const server = await startStaticServer(DIST);
    try {
      await installAndControl(page, server.url);
      await server.stop(); // The network is now genuinely unreachable.

      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Discover something special.",
      );
      await expect(page.getByText("Our collection is taking shape.")).toBeVisible();

      // Any page address falls back to the cached app shell instead of a browser error page.
      await page.goto(`${server.url}some/page/that/does/not/exist`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Discover something special.",
      );

      // The dedicated offline page is cached too.
      const offlineText = await page.evaluate(async () => (await fetch("/offline.html")).text());
      expect(offlineText).toContain("You appear to be offline.");
    } finally {
      await server.stop();
    }
  });

  test("a new version replaces the old one: old cache deleted, page reloads itself", async ({
    page,
  }) => {
    const server = await startStaticServer(DIST);
    try {
      await installAndControl(page, server.url);
      const before = await page.evaluate(() => caches.keys());
      expect(before).toHaveLength(1);

      // Ship "version 2": a different build id and a changed page.
      server.setOverride((urlPath, body) => {
        if (urlPath === "/sw.js") {
          return Buffer.from(
            body.toString().replace(/const BUILD_ID = "[0-9a-f]{12}";/, 'const BUILD_ID = "ffffffffffff";'),
          );
        }
        if (urlPath === "/") {
          return Buffer.from(
            body.toString().replace("</head>", '<meta name="build-marker" content="v2"></head>'),
          );
        }
        return body;
      });

      // Mark the current page so we can tell when it has reloaded.
      await page.evaluate(() => {
        (window as unknown as { oldPage: boolean }).oldPage = true;
      });
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });

      await expect
        .poll(
          async () => {
            try {
              return await page.evaluate(
                () => (window as unknown as { oldPage?: boolean }).oldPage,
              );
            } catch {
              return "reloading"; // The page is navigating right now, which is what we want.
            }
          },
          { message: "the page should reload itself once the new worker takes over" },
        )
        .toBeUndefined();

      await expect
        .poll(() => page.evaluate(() => caches.keys()))
        .toEqual(["aurelle-shell-ffffffffffff"]);

      const cachedShell = await page.evaluate(async () => {
        const cache = await caches.open("aurelle-shell-ffffffffffff");
        return (await cache.match("/"))?.text();
      });
      expect(cachedShell).toContain('content="v2"');
    } finally {
      await server.stop();
    }
  });
});
