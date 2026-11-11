import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";

import { JsonLdScript } from "@/components/json-ld";

type Post = NonNullable<QueryPostSlugDataResult>;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "America/New_York",
});
const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

const CORRECTION_LABEL: Record<string, string> = {
  correction: "Correction",
  clarification: "Clarification",
  update: "Update",
};

/** Italic note above the story: a disclosure or how it was reported. */
export function ArticleEditorsNote({ note }: { note: Post["editorsNote"] }) {
  if (!note) return null;
  return (
    <p className="mx-auto mt-8 max-w-prose border-l-2 border-primary pl-4 font-serif text-base italic text-muted-foreground">
      <span className="font-semibold not-italic">Editor's note: </span>
      {note}
    </p>
  );
}

/** The story in a few lines, above the body. */
export function ArticleKeyTakeaways({
  items,
}: {
  items: Post["keyTakeaways"];
}) {
  if (!items?.length) return null;
  return (
    <section
      aria-labelledby="key-takeaways"
      className="mx-auto mt-8 max-w-prose rounded-xl border bg-muted/40 p-5"
    >
      <h2 id="key-takeaways" className="kicker text-primary">
        Key takeaways
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 font-serif text-[1.05rem] leading-snug">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/** Reader questions with short answers, plus matching FAQPage structured data. */
export function ArticleFaq({ faqs }: { faqs: Post["faqs"] }) {
  const pairs = (faqs ?? []).filter((faq) => faq.question && faq.answer);
  if (pairs.length === 0) return null;

  return (
    <section
      aria-labelledby="article-faq"
      className="mx-auto mt-10 max-w-prose"
    >
      <h2
        id="article-faq"
        className="font-display text-2xl font-bold uppercase"
      >
        Questions &amp; answers
      </h2>
      <dl className="mt-4 divide-y border-y">
        {pairs.map((faq) => (
          <div key={faq._key} className="py-4">
            <dt className="font-semibold">{faq.question}</dt>
            <dd className="mt-2 font-serif text-muted-foreground">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
      <JsonLdScript
        id="article-faq-json-ld"
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pairs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />
    </section>
  );
}

/** Contributor credit, sources, and the correction log, after the story. */
export function ArticleFooterNotes({
  contributors,
  sources,
  corrections,
}: {
  contributors: Post["contributors"];
  sources: Post["sources"];
  corrections: Post["corrections"];
}) {
  const names = (contributors ?? []).filter((person) => person.name);
  const sourceList = (sources ?? []).filter((source) => source.url);
  const correctionList = (corrections ?? []).filter((item) => item.text);
  if (!names.length && !sourceList.length && !correctionList.length) {
    return null;
  }

  return (
    <footer className="mx-auto mt-10 max-w-prose space-y-6 border-t pt-6 text-sm text-muted-foreground">
      {names.length > 0 ? (
        <p className="italic">
          {listFormat.format(names.map((person) => person.name as string))}{" "}
          contributed to this report.
        </p>
      ) : null}

      {correctionList.length > 0 ? (
        <section aria-label="Corrections and updates">
          <ul className="space-y-2">
            {correctionList.map((item) => (
              <li key={item._key}>
                <span className="font-semibold text-foreground">
                  {CORRECTION_LABEL[item.kind ?? "correction"] ?? "Correction"}
                  {item.date
                    ? `, ${dateFormat.format(new Date(item.date))}`
                    : ""}
                  :
                </span>{" "}
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sourceList.length > 0 ? (
        <section aria-labelledby="article-sources">
          <h2 id="article-sources" className="kicker text-foreground">
            Sources
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {sourceList.map((source) => (
              <li key={source._key}>
                <a
                  href={source.url}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {source.title ?? source.url}
                </a>
                {source.publisher ? `, ${source.publisher}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </footer>
  );
}
