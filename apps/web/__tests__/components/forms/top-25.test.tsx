import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { toast } from "sonner";

const { mockPush, mockParams, mockFetch, mockCapture } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockParams: { sport: "football", division: "fbs" as const },
  mockFetch: vi.fn(),
  mockCapture: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>, _msgs?: unknown) => {
      return promise.catch(() => undefined);
    }),
    success: vi.fn(),
  },
}));

vi.mock("@/components/virtualized-combobox", () => ({
  VirtualizedCombobox: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (v: string) => void;
  }) => (
    <input
      aria-label="team-select"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import Top25, { type Top25FormRef } from "@/components/forms/top-25";

function makeSchools(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    _id: `school-${i + 1}`,
    name: `School ${i + 1}`,
    shortName: `S${i + 1}`,
    abbreviation: `S${i + 1}`,
    nickname: "Nick",
    image: null,
  })) as never;
}

function makePreviousBallot(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    userId: "user-1",
    division: "fbs",
    week: 1,
    year: 2025,
    createdAt: new Date(),
    teamId: `school-${i + 1}`,
    rank: i + 1,
    points: 25 - i,
    schoolName: `School ${i + 1}`,
    schoolShortName: `S${i + 1}`,
    schoolAbbreviation: `S${i + 1}`,
    schoolNickname: "Nick",
    schoolImageUrl: "",
  }));
}

describe("Top25 form", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockFetch.mockReset();
    mockCapture.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.promise).mockClear();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("populates ranks from previous ballot and toasts success", () => {
    const ref = createRef<Top25FormRef>();
    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(25)}
      />,
    );

    ref.current?.populateWithPreviousBallot();
    expect(toast.success).toHaveBeenCalledWith(
      "Form populated with your previous ballot",
    );
  });

  it("submits to the college vote API and redirects on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Vote submitted successfully" }),
    });

    const ref = createRef<Top25FormRef>();
    const user = userEvent.setup();

    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(25)}
      />,
    );

    ref.current?.populateWithPreviousBallot();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Submit$/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/vote/college/football/rankings/fbs",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.rank_1).toBe("school-1");
    expect(body.sport).toBe("football");
    expect(body.division).toBe("fbs");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/vote/college/football/fbs/confirmation",
      );
    });
  });

  it("captures ballot_submission_error analytics on 409", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({ error: "You have already voted for this week" }),
    });

    const ref = createRef<Top25FormRef>();
    const user = userEvent.setup();

    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(25)}
      />,
    );

    ref.current?.populateWithPreviousBallot();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Submit$/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    await waitFor(() => {
      expect(mockCapture).toHaveBeenCalledWith(
        "ballot_submission_error",
        expect.objectContaining({
          status_code: 409,
          error_message: "You have already voted for this week",
        }),
      );
    });
  });
});
