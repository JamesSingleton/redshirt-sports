## 25. Accessibility

Target **WCAG 2.2 AA**.

- Semantic HTML: `<article>`, `<nav>`, headings in order, `<table>` with `<caption>`, `scope` for poll and standings tables.
- Color: team colors pass contrast checks automatically (fallback to neutral); movement arrows also have text ("Up 3") not color only.
- Keyboard: ballot reordering with buttons and "move to rank" input (drag-and-drop is an enhancement); bracket picks are buttons in round lists; visible focus rings; skip links.
- Screen readers: countdown announces only at thresholds; images have alt text (Sanity required field); logos `alt="Montana State Bobcats logo"` only when meaningful, otherwise empty alt next to visible name.
- Motion: respect `prefers-reduced-motion` for bracket animations and confetti.
- Forms: labels, error messages tied with `aria-describedby`; Clerk components are accessible but check them with axe.
- Media: captions for video, transcripts for podcasts (also good for SEO/AEO).
- Testing: axe in CI, manual screen reader pass (VoiceOver + NVDA) on ballot editor and bracket editor before each season.
