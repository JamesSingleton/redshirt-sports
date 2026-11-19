import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  review: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/actions/portal", () => ({ reviewSubmission: mocks.review }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@redshirt-sports/ui/components/toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

import { submissionPayloadSchema } from "@redshirt-sports/db/portal";

import type { SubmissionInbox } from "@/actions/portal";
import { EMPTY_BIO } from "@/components/portal/new-player-form";
import { SubmissionInboxList } from "@/components/portal/submission-inbox";
import { prefillFromSubmission } from "@/components/portal/submission-prefill";

const payload = submissionPayloadSchema.parse({
  playerFirstName: "Test",
  playerLastName: "Submission",
  sportSlug: "football",
  currentSchool: "Montana",
  move: "committed",
  destinationSchool: "Boise State",
  happenedOn: "2026-01-15",
  link: "https://example.test/post",
});
const submission = (
  overrides: Partial<SubmissionInbox["submissions"][number]> = {},
): SubmissionInbox["submissions"][number] => ({
  id: 7,
  status: "new",
  submitterRole: "coach",
  submitterName: "Test Coach",
  submitterEmail: "coach@example.test",
  payload,
  matchedPlayerId: null,
  reviewNote: null,
  reviewedAt: null,
  createdAt: new Date("2026-01-16T15:00:00Z"),
  reviewer: null,
  ...overrides,
});
const inbox = (
  submissions: SubmissionInbox["submissions"],
  extra: Partial<SubmissionInbox> = {},
): SubmissionInbox => ({
  status: "new",
  submissions,
  hasMore: false,
  ...extra,
});

describe("submission inbox", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows what was reported and who sent it", () => {
    render(<SubmissionInboxList inbox={inbox([submission()])} />);
    const card = screen
      .getByRole("heading", { name: "Test Submission" })
      .closest("li")!;
    expect(
      within(card).getByText("Committed to a new school"),
    ).toBeInTheDocument();
    expect(within(card).getByText("Boise State")).toBeInTheDocument();
    expect(
      within(card).getByText(/Test Coach \(A coach\)/),
    ).toBeInTheDocument();
    // Their link opens without passing our address along.
    expect(
      within(card).getByRole("link", { name: "https://example.test/post" }),
    ).toHaveAttribute("rel", "noopener noreferrer nofollow");
    expect(
      within(card).getByRole("link", { name: "Add as a new player" }),
    ).toHaveAttribute("href", "/portal/new?submission=7");
    expect(screen.getByRole("link", { name: "New" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("closes a submission and refreshes the list", async () => {
    mocks.review.mockResolvedValue({ ok: true, message: "Saved." });
    render(<SubmissionInboxList inbox={inbox([submission()])} />);
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() =>
      expect(mocks.review).toHaveBeenCalledWith({ id: 7, status: "rejected" }),
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.success).toHaveBeenCalledWith("Marked rejected");

    mocks.review.mockResolvedValueOnce({ ok: false, message: "Nope." });
    await userEvent.click(screen.getByRole("button", { name: "Spam" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Nope."));
    await userEvent.click(
      screen.getByRole("button", { name: /Done \(recorded/ }),
    );
    await waitFor(() =>
      expect(mocks.review).toHaveBeenLastCalledWith({
        id: 7,
        status: "accepted",
      }),
    );
  });

  it("shows reviewed, unreadable, and older submissions", () => {
    render(
      <SubmissionInboxList
        inbox={inbox(
          [
            submission({
              id: 9,
              status: "accepted",
              reviewer: "James Singleton",
              matchedPlayerId: 100050,
              submitterName: null,
              submitterRole: "mascot",
            }),
            submission({ id: 8, status: "spam", payload: null }),
          ],
          { status: "accepted", hasMore: true },
        )}
      />,
    );
    expect(screen.getByText("Accepted by James Singleton")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Player #100050" }),
    ).toHaveAttribute("href", "/portal/players/100050");
    expect(screen.getByText(/From someone \(mascot\)/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Unreadable submission" }),
    ).toBeInTheDocument();
    // Reviewed ones have no buttons.
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Older submissions" }),
    ).toHaveAttribute("href", "/portal/submissions?status=accepted&before=8");
  });

  it("says when nothing is waiting", () => {
    const { unmount } = render(<SubmissionInboxList inbox={inbox([])} />);
    expect(screen.getByText(/Nothing waiting/)).toBeInTheDocument();
    unmount();
    render(<SubmissionInboxList inbox={inbox([], { status: "spam" })} />);
    expect(screen.getByText("None.")).toBeInTheDocument();
  });
});

describe("prefilling the entry form from a submission", () => {
  const sports = [
    { id: "s-mbb", slug: "mens-basketball" },
    { id: "s-fb", slug: "football" },
  ];
  const from = { id: 7, submitterRole: "coach", payload };

  it("fills what they told us and keeps their link private", () => {
    const { bio, entry } = prefillFromSubmission(from, sports, EMPTY_BIO);
    expect(bio).toMatchObject({ firstName: "Test", lastName: "Submission" });
    expect(entry).toMatchObject({
      sportId: "s-fb",
      origin: { schoolId: null, schoolName: "Montana", label: "Montana" },
      source: {
        sourceType: "submission",
        sourceUrl: "https://example.test/post",
        sourceNote: "Submission #7 from a coach",
        storySlug: "",
      },
    });
    // A commitment's date isn't when they entered.
    expect(entry.enteredAt).not.toBe("2026-01-15T12:00");
  });

  it("dates the entry from an 'entered' report, and copes with gaps", () => {
    const entered = prefillFromSubmission(
      { ...from, payload: { ...payload, move: "entered", link: undefined } },
      sports,
      EMPTY_BIO,
    );
    expect(entered.entry.enteredAt).toBe("2026-01-15T12:00");
    expect(entered.entry.source.sourceUrl).toBe("");
    const unknownSport = prefillFromSubmission(
      { ...from, payload: { ...payload, sportSlug: "lacrosse" } },
      sports,
      EMPTY_BIO,
    );
    expect(unknownSport.entry.sportId).toBe("s-mbb");
    expect(prefillFromSubmission(from, [], EMPTY_BIO).entry.sportId).toBe("");
  });
});
