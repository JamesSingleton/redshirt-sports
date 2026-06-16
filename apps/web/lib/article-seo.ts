export function getArticleTagNames(
  tags?: Array<{ name?: string | null } | null> | null,
): string[] {
  return (
    tags
      ?.map((tag) => tag?.name)
      .filter((name): name is string => Boolean(name)) ?? []
  );
}
