import { render, screen } from "@testing-library/react";

import {
  ArticleEditorsNote,
  ArticleFaq,
  ArticleFooterNotes,
  ArticleKeyTakeaways,
} from "@/components/article/article-standards";

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data, id }: { data: unknown; id: string }) => (
    <script id={id} type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  ),
}));

describe("ArticleEditorsNote", () => {
  it("renders nothing without a note", () => {
    const { container } = render(<ArticleEditorsNote note={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the note with its label", () => {
    render(<ArticleEditorsNote note="The author is a Montana alumnus." />);
    expect(screen.getByText("Editor's note:")).toBeInTheDocument();
    expect(
      screen.getByText("The author is a Montana alumnus."),
    ).toBeInTheDocument();
  });
});

describe("ArticleKeyTakeaways", () => {
  it("renders nothing for a missing or empty list", () => {
    expect(
      render(<ArticleKeyTakeaways items={undefined} />).container,
    ).toBeEmptyDOMElement();
    expect(
      render(<ArticleKeyTakeaways items={[]} />).container,
    ).toBeEmptyDOMElement();
  });

  it("lists each takeaway", () => {
    render(<ArticleKeyTakeaways items={["First point.", "Second point."]} />);
    expect(
      screen.getByRole("heading", { name: "Key takeaways" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("ArticleFaq", () => {
  it("renders nothing without complete pairs", () => {
    expect(
      render(<ArticleFaq faqs={undefined} />).container,
    ).toBeEmptyDOMElement();
    expect(
      render(
        <ArticleFaq
          faqs={[{ _key: "a", _type: "faq", question: "Why?" }] as never}
        />,
      ).container,
    ).toBeEmptyDOMElement();
  });

  it("renders pairs and FAQPage structured data", () => {
    const { container } = render(
      <ArticleFaq
        faqs={
          [
            {
              _key: "a",
              _type: "faq",
              question: "How many teams make the FCS playoffs?",
              answer: "Twenty-four teams make the field.",
            },
            { _key: "b", _type: "faq", answer: "No question" },
          ] as never
        }
      />,
    );
    expect(
      screen.getByText("How many teams make the FCS playoffs?"),
    ).toBeInTheDocument();
    const jsonLd = JSON.parse(
      container.querySelector("#article-faq-json-ld")?.textContent ?? "{}",
    );
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(1);
    expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe(
      "Twenty-four teams make the field.",
    );
  });
});

describe("ArticleFooterNotes", () => {
  it("renders nothing when every list is empty or incomplete", () => {
    expect(
      render(
        <ArticleFooterNotes
          contributors={null}
          sources={undefined}
          corrections={undefined}
        />,
      ).container,
    ).toBeEmptyDOMElement();
    expect(
      render(
        <ArticleFooterNotes
          contributors={[{ _id: "1", name: null }] as never}
          sources={[{ _key: "s", title: "No link" }] as never}
          corrections={[{ _key: "c", kind: "correction" }] as never}
        />,
      ).container,
    ).toBeEmptyDOMElement();
  });

  it("credits contributors", () => {
    render(
      <ArticleFooterNotes
        contributors={
          [
            { _id: "1", name: "Jane Doe" },
            { _id: "2", name: "John Roe" },
          ] as never
        }
        sources={undefined}
        corrections={undefined}
      />,
    );
    expect(
      screen.getByText("Jane Doe and John Roe contributed to this report."),
    ).toBeInTheDocument();
  });

  it("labels corrections by kind, with and without a date", () => {
    render(
      <ArticleFooterNotes
        contributors={null}
        sources={undefined}
        corrections={
          [
            {
              _key: "a",
              kind: "clarification",
              date: "2026-03-05T17:00:00Z",
              text: "Clarified the timeline.",
            },
            { _key: "b", text: "Fixed the score." },
            { _key: "c", kind: "retraction", text: "Unknown kind." },
          ] as never
        }
      />,
    );
    expect(
      screen.getByText("Clarification, March 5, 2026:"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Correction:")).toHaveLength(2);
    expect(screen.getByText("Fixed the score.")).toBeInTheDocument();
  });

  it("lists sources with a title and publisher when present", () => {
    render(
      <ArticleFooterNotes
        contributors={null}
        corrections={undefined}
        sources={
          [
            {
              _key: "a",
              title: "Council summary",
              publisher: "NCAA",
              url: "https://ncaa.org/summary",
            },
            { _key: "b", url: "https://example.com/report" },
          ] as never
        }
      />,
    );
    expect(
      screen.getByRole("link", { name: "Council summary" }),
    ).toHaveAttribute("href", "https://ncaa.org/summary");
    expect(screen.getByText(/, NCAA/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.com/report" }),
    ).toBeInTheDocument();
  });
});
