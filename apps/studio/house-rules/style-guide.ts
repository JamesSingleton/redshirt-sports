/**
 * The Redshirt Sports style sheet: wording the desk has standardized. Each
 * entry is a warning, never an error, because a quote or a proper name can
 * legitimately break it. Add a term by adding a row.
 */
export type StyleTerm = {
  id: string;
  /** Must be a global regex; matched against plain text. */
  pattern: RegExp;
  /** Shown to the writer. `$&` is replaced by what they typed. */
  advice: string;
};

export const STYLE_TERMS: StyleTerm[] = [
  {
    id: "division-numerals",
    pattern: /\bDivision\s+[123]\b/g,
    advice:
      'Write NCAA divisions with Roman numerals: "Division I", "Division II", "Division III" (found "$&").',
  },
  {
    id: "big-ten",
    pattern: /\bBig\s+10\b/g,
    advice: 'The conference is the "Big Ten" (found "$&").',
  },
  {
    id: "big-12",
    pattern: /\bBig\s+(?:XII|Twelve)\b/g,
    advice: 'The conference is the "Big 12" (found "$&").',
  },
  {
    id: "pac-12",
    pattern: /\b(?:PAC-12|Pac\s12|PAC\s12|Pac12)\b/g,
    advice: 'The conference is the "Pac-12" (found "$&").',
  },
  {
    id: "power-five",
    pattern: /\bPower\s+(?:5|Five)\b/g,
    advice:
      'Since 2024 the group is the "Power Four". Use "Power Five" only for seasons before that (found "$&").',
  },
  {
    id: "heisman",
    pattern: /\bHeisman\s+trophy\b/g,
    advice: 'Capitalize "Heisman Trophy".',
  },
  {
    id: "redshirt-hyphen",
    pattern: /\b(?:redshirt|true)-(?:freshman|sophomore|junior|senior)\b/gi,
    advice: 'No hyphen: "redshirt freshman", "true freshman" (found "$&").',
  },
  {
    id: "ncaa-tournament",
    pattern: /\bNCAA\s+tournament\b/g,
    advice: 'Capitalize "NCAA Tournament".',
  },
  {
    id: "first-team",
    pattern: /\b(?:1st|2nd|3rd)[\s-]team\b/gi,
    advice: 'Spell out all-conference teams: "first-team", "second-team".',
  },
  {
    id: "exclamation",
    pattern: /!{2,}/g,
    advice: "One exclamation mark at most, and only inside a quote.",
  },
];

/** Link text that tells a reader, or a screen reader, nothing. */
export const VAGUE_LINK_TEXT = [
  "here",
  "click here",
  "this",
  "this link",
  "link",
  "read more",
  "more",
  "source",
];

/** Headline openers that belong in the article type, not the headline. */
export const HEADLINE_LABEL_PREFIX =
  /^(?:breaking|exclusive|report|update|opinion|column|recap|preview)\s*[:\-–—]\s*/i;

export function styleFindingsFor(
  text: string,
): Array<{ id: string; advice: string }> {
  const hits: Array<{ id: string; advice: string }> = [];
  for (const term of STYLE_TERMS) {
    // A shared global regex keeps `lastIndex` between calls; reset it.
    term.pattern.lastIndex = 0;
    const match = term.pattern.exec(text);
    if (match) {
      hits.push({ id: term.id, advice: term.advice.replace("$&", match[0]) });
    }
  }
  return hits;
}
