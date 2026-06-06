type InternalRef = {
  _type?: string;
  slug?: string;
};

type CustomUrlValue = {
  type?: "internal" | "external";
  external?: string;
  internal?: InternalRef;
  openInNewTab?: boolean;
};

export function resolveCustomUrlHref(link: CustomUrlValue | undefined): string {
  if (!link?.type) return "#";

  if (link.type === "external" && link.external) {
    return link.external;
  }

  if (link.type === "internal" && link.internal) {
    const { _type, slug } = link.internal;
    if (!slug) return "#";

    switch (_type) {
      case "post":
        return `/${slug}`;
      case "school":
        return `/college/teams/${slug}`;
      case "author":
        return `/authors/${slug}`;
      default:
        return "#";
    }
  }

  return "#";
}
