import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Reads the real design tokens so the check can never drift from the CSS.
const tokensCss = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

function colour(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokensCss);
  if (!match?.[1]) {
    throw new Error(`Token --color-${name} not found in tokens.css`);
  }
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

// WCAG AA: 4.5:1 for normal text. Body text should clear the stricter AAA 7:1.
const pairs: ReadonlyArray<[string, string, string, number]> = [
  ["ivory text on charcoal", "ivory", "charcoal", 7],
  ["muted text on charcoal", "muted", "charcoal", 4.5],
  ["muted text on card surface", "muted", "surface", 4.5],
  ["gold text on charcoal", "gold", "charcoal", 4.5],
  ["gold text on card surface", "gold", "surface", 4.5],
  ["charcoal text on gold button", "charcoal", "gold", 4.5],
  ["charcoal text on hovered gold button", "charcoal", "gold-hover", 4.5],
];

for (const [label, foreground, background, minimum] of pairs) {
  test(`contrast: ${label} is at least ${minimum}:1`, () => {
    expect(contrast(colour(foreground), colour(background))).toBeGreaterThanOrEqual(minimum);
  });
}
