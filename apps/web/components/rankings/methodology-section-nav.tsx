"use client";

import { useEffect, useState } from "react";

const ACTIVE_LINE = 160;

export function MethodologySectionNav({
  sections,
}: {
  sections: readonly { id: string; label: string }[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const update = () => {
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) {
          continue;
        }
        if (element.getBoundingClientRect().top <= ACTIVE_LINE) {
          current = section.id;
        }
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [sections]);

  return (
    <nav
      className="sticky top-20 grid gap-0.5 text-sm"
      aria-label="On this page"
    >
      {sections.map((section) => {
        const isActive = section.id === activeId;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={isActive ? "location" : undefined}
            onClick={() => setActiveId(section.id)}
            className={
              isActive
                ? "rounded-md bg-muted px-2 py-1.5 font-semibold text-foreground"
                : "rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
