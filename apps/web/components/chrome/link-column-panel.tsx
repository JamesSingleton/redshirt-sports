import { NavListItem } from "@/components/chrome/nav-list-item";
import type { NavColumnItem } from "@/components/navbar";

/** Links in a column that resolved to a URL. */
export function columnLinks(item: NavColumnItem) {
  return item.links.filter((link): link is typeof link & { href: string } =>
    Boolean(link.href),
  );
}

/** Dropdown for an editor-built column of links (e.g. About). */
export function ColumnMenuContent({ item }: { item: NavColumnItem }) {
  const links = columnLinks(item);

  return (
    <ul
      className={
        links.length > 3
          ? "grid w-[440px] grid-cols-2 gap-1 p-1"
          : "grid w-[260px] gap-1 p-1"
      }
    >
      {links.map((link) => (
        <NavListItem
          key={link._key}
          href={link.href}
          title={link.name}
          openInNewTab={link.openInNewTab}
        >
          {link.description}
        </NavListItem>
      ))}
    </ul>
  );
}
