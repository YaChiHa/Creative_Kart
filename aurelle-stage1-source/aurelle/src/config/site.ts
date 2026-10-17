// All visible copy and navigation lives here so it is easy to edit in one place.
// Only content supplied for Stage 1 is used. No products, prices, phone numbers or
// other business details appear anywhere until the business provides them.

export interface NavItem {
  readonly label: string;
  /** In-page anchor. Every href here must match an element id in the page. */
  readonly href: string;
}

export interface PromiseItem {
  readonly title: string;
  readonly text: string;
}

export const site = {
  name: "Aurelle",
  hero: {
    heading: "Discover something special.",
    text: "A thoughtfully presented collection from your local store. Quality products, personal service, closer to home.",
  },
  status: "Our collection is taking shape.",
  statusDetail:
    "Products and categories will appear here as soon as the collection is ready. Please check back soon.",
  footer: "Your local store · India",
  nav: [
    { label: "Promise", href: "#promise" },
    { label: "Collection", href: "#collection" },
  ] satisfies readonly NavItem[],
  promise: [
    {
      title: "Quality products",
      text: "A thoughtfully presented collection, made easy to explore.",
    },
    {
      title: "Personal service",
      text: "Real people from your local store, ready to help you choose.",
    },
    {
      title: "Closer to home",
      text: "Your local store, a short distance away rather than a parcel away.",
    },
  ] satisfies readonly PromiseItem[],
} as const;
