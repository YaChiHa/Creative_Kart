import { expect, test } from "@playwright/test";

const WIDTHS = [320, 360, 412, 768, 1280] as const;

for (const width of WIDTHS) {
  test.describe(`viewport ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("has no horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        offenders: Array.from(document.querySelectorAll("body *"))
          .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 0.5)
          .map((element) => element.tagName.toLowerCase() + "." + element.className),
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(metrics.offenders).toEqual([]);
    });

    test("links are comfortable touch targets", async ({ page }) => {
      await page.goto("/");

      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"))
          .map((element) => {
            const box = element.getBoundingClientRect();
            return { text: element.textContent?.trim() ?? "", width: box.width, height: box.height };
          })
          // The skip link is off-screen until focused, so it has its own focus test.
          .filter((target) => target.width > 0 && target.height > 0)
          .filter((target) => target.width < 44 || target.height < 44),
      );

      expect(small).toEqual([]);
    });

    test("body text stays readable", async ({ page }) => {
      await page.goto("/");
      const fontSize = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector(".hero__text") as Element).fontSize),
      );
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });
  });
}

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("page is fully usable and has no running animations or smooth scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const state = await page.evaluate(() => ({
      animations: document.getAnimations().length,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    }));
    expect(state.animations).toBe(0);
    expect(state.scrollBehavior).toBe("auto");
  });
});
