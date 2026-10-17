interface LogoProps {
  /** Rendered width and height in CSS pixels. */
  readonly size?: number;
  /** Line thickness in the 64 x 64 drawing space. */
  readonly strokeWidth?: number;
}

// An "A" drawn from two strokes whose crossbar is a small diamond.
// The same geometry is used by scripts/generate-icons.mjs for the favicon and app icons.
// If you change the shapes here, change them there too and run `npm run icons`.
export function Logo({ size = 40, strokeWidth = 5 }: LogoProps) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 54 L32 10 L52 54"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      <path d="M32 34 L38 42 L32 50 L26 42 Z" fill="currentColor" />
    </svg>
  );
}
