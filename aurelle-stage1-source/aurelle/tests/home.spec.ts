import { expect, test } from "@playwright/test";
import { watchForProblems } from "./helpers";

test.describe("homepage", () => {
  test("shows the Aurelle brand content", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Aurelle/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discover something special.");
    await expect(
      page.getByText("A thoughtfully presented collection from your local store."),
    ).toBeVisible();
    await expect(page.getByText("Our collection is taking shape.")).toBeVisible();
    await expect(page.getByText("Your local store · India")).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("loads without console errors, page errors, failed requests or missing files", async ({
    page,
  }) => {
    const problems = watchForProblems(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(problems).toEqual({
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      badResponses: [],
    });
  });

  test("every link points at something real", async ({ page }) => {
    await page.goto("/");

    const hrefs = await page
      .locator("a")
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      expect(href, "links must be in-page anchors in Stage 1").toMatch(/^#[\w-]+$/);
      await expect(page.locator(href), `${href} needs a matching element`).toHaveCount(1);
    }
    // No buttons that do nothing: Stage 1 has no interactive controls besides links.
    await expect(page.locator("button")).toHaveCount(0);
  });

  test("navigation links scroll to their sections", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Collection", exact: true }).click();
    await expect(page).toHaveURL(/#collection$/);
    await expect(page.locator("#collection")).toBeInViewport();
  });
});

test.describe("keyboard and accessibility", () => {
  test("skip link is the first tab stop, becomes visible and moves focus to main", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport({ ratio: 1 });

    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("every focusable element shows a visible focus indicator", async ({ page }) => {
    await page.goto("/");

    const focusableCount = await page.locator("a[href]").count();
    expect(focusableCount).toBeGreaterThan(3);

    for (let index = 0; index < focusableCount; index += 1) {
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) {
          return null;
        }
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline, `tab stop ${index + 1} should be a real element`).not.toBeNull();
      expect(outline?.style).not.toBe("none");
      expect(outline?.width).toBeGreaterThanOrEqual(2);
    }
  });

  test("heading structure has exactly one h1 and ordered sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h2")).toHaveText(["Our promise", "The collection"]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("still shows the brand message", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discover something special.");
    await expect(page.getByText("Your local store · India")).toBeVisible();
  });
});
