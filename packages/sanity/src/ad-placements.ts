/**
 * Fixed positions the site already renders. Editors choose among these when
 * they publish a sponsorship. Adding a position still requires a code change
 * that mounts `<AdSlot placement="..." />` in the layout.
 */
export const AD_PLACEMENTS = [
  {
    id: "home-leaderboard",
    title: "Homepage leaderboard",
    hint: "970×90",
    width: 970,
    height: 90,
    sizes: "(max-width: 1024px) 100vw, 970px",
  },
  {
    id: "home-sidebar",
    title: "Homepage sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
  {
    id: "article-sidebar",
    title: "Article sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
  {
    id: "news-sidebar",
    title: "News archive sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
  {
    id: "rankings-index-sidebar",
    title: "Rankings index sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
  {
    id: "rankings-week-sidebar",
    title: "Rankings week sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
  {
    id: "rankings-methodology-sidebar",
    title: "Rankings methodology sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
  {
    id: "team-sidebar",
    title: "Team page sidebar",
    hint: "300×250",
    width: 300,
    height: 250,
    sizes: "300px",
  },
] as const;

export type AdPlacementId = (typeof AD_PLACEMENTS)[number]["id"];

export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export function getAdPlacement(id: AdPlacementId): AdPlacement {
  const placement = AD_PLACEMENTS.find((item) => item.id === id);
  if (!placement) {
    throw new Error(`Unknown ad placement: ${id}`);
  }
  return placement;
}
