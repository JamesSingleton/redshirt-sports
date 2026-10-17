import {
  escapeHTML,
  type PortableTextComponents,
  type PortableTextMarkComponent,
  type PortableTextTypeComponent,
  toHTML,
  uriLooksSafe,
} from "@portabletext/to-html";
import { urlForJpeg } from "@redshirt-sports/sanity/client";
import type { RssFeedQueryResult } from "@redshirt-sports/sanity/types";

type Body = RssFeedQueryResult[number]["body"];
type BodyMember<T extends Body[number]["_type"]> = Extract<
  Body[number],
  { _type: T }
>;

type LinkMarkValue = {
  _type: string;
  href?: string | null;
};

/** Resolves site-relative hrefs against `baseUrl`; returns null for unsafe or unparsable URLs. */
export function toAbsoluteUrl(href: string, baseUrl: string) {
  if (!uriLooksSafe(href)) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function createComponents(baseUrl: string): PortableTextComponents {
  const linkMark: PortableTextMarkComponent<LinkMarkValue> = ({
    value,
    children,
  }) => {
    const href = value?.href ? toAbsoluteUrl(value.href, baseUrl) : null;
    if (!href) return children;
    return `<a href="${escapeHTML(href)}">${children}</a>`;
  };

  const image: PortableTextTypeComponent<BodyMember<"image">> = ({ value }) => {
    if (!value.asset?._ref) return "";
    const src = urlForJpeg(value).width(1200).quality(80).url();
    const credit = value.credit ?? value.attribution;
    const caption = credit
      ? `<figcaption>Source: ${escapeHTML(credit)}</figcaption>`
      : "";
    return `<figure><img src="${escapeHTML(src)}" alt="${escapeHTML(value.alt)}" />${caption}</figure>`;
  };

  const table: PortableTextTypeComponent<BodyMember<"table">> = ({ value }) => {
    const rows = value.rows ?? [];
    if (rows.length === 0) return "";
    const headerRows = rows.slice(0, value.headerRows ?? 0);
    const bodyRows = rows.slice(headerRows.length);
    const renderRow = (row: (typeof rows)[number], tag: "th" | "td") =>
      `<tr>${(row.cells ?? [])
        .map(
          (cell) =>
            `<${tag}>${toHTML(cell.value ?? [], {
              components: createComponents(baseUrl),
              onMissingComponent: false,
            })}</${tag}>`,
        )
        .join("")}</tr>`;
    const head = headerRows.length
      ? `<thead>${headerRows.map((row) => renderRow(row, "th")).join("")}</thead>`
      : "";
    const body = bodyRows.map((row) => renderRow(row, "td")).join("");
    return `<table>${head}<tbody>${body}</tbody></table>`;
  };

  const twitter: PortableTextTypeComponent<BodyMember<"twitter">> = ({
    value,
  }) => {
    if (!value.id) return "";
    const href = `https://x.com/i/status/${encodeURIComponent(value.id)}`;
    return `<p><a href="${escapeHTML(href)}">View post on X</a></p>`;
  };

  const youtubeEmbed: PortableTextTypeComponent<BodyMember<"youtubeEmbed">> = ({
    value,
  }) => {
    const href = toAbsoluteUrl(value.url, baseUrl);
    if (!href) return "";
    return `<p><a href="${escapeHTML(href)}">Watch on YouTube</a></p>`;
  };

  return {
    marks: {
      customLink: linkMark,
      customUrl: linkMark,
      internalLink: linkMark,
      link: linkMark,
    },
    types: { image, table, twitter, youtubeEmbed },
  };
}

/** Renders an article body to HTML suitable for RSS `content:encoded`. */
export function portableTextToHtml(body: Body, baseUrl: string) {
  return toHTML(body, {
    components: createComponents(baseUrl),
    onMissingComponent: false,
  });
}
