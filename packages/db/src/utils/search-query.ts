export const buildSearchQuery = (input: string) => {
  return input
    .trim()
    .split(/\s+/)
    .map((term) => `${term.toLowerCase()}:*`)
    .join(" & ");
};

/** A LIKE pattern matching `term` anywhere, with its own wildcards escaped. */
export const likeContains = (term: string) =>
  `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
