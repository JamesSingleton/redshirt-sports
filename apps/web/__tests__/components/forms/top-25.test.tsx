import { toast } from "@redshirt-sports/ui/components/toast";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

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

vi.mock("@redshirt-sports/ui/components/toast", () => ({
  toast: Object.assign(vi.fn(), {
    promise: vi.fn((promise: Promise<unknown>, _msgs?: unknown) => {
      return promise.catch(() => undefined);
    }),
    success: vi.fn(),
  }),
}));

vi.mock("@/components/virtualized-combobox", () => ({
  VirtualizedCombobox: ({
    value,
    onChange,
    "aria-label": ariaLabel,
  }: {
    value?: string;
    onChange: (v: string) => void;
    "aria-label": string;
  }) => (
    <input
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import Top25, {
  EditTop25,
  formSchema,
  type Top25FormRef,
} from "@/components/forms/top-25";

function rankInput(rank: number) {
  return screen.getByRole("textbox", { name: `Rank ${rank}` });
}

function ranks(count = 25) {
  return Array.from(
    { length: count },
    (_, i) => (rankInput(i + 1) as HTMLInputElement).value,
  );
}

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
    vi.mocked(toast).mockReset();
    vi.mocked(toast.promise).mockClear();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function populateWithPreviousBallot(
    ref: React.RefObject<Top25FormRef | null>,
  ) {
    await act(async () => {
      ref.current?.populateWithPreviousBallot();
    });
  }

  it("populates ranks from previous ballot and toasts success", async () => {
    const ref = createRef<Top25FormRef>();
    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(25)}
      />,
    );

    await populateWithPreviousBallot(ref);
    expect(toast.success).toHaveBeenCalledWith(
      "Form populated with your previous ballot",
    );
  });

  it("shows how many teams are ranked", async () => {
    const ref = createRef<Top25FormRef>();
    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(18)}
      />,
    );

    const meter = screen.getByRole("meter", { name: "Teams ranked" });
    expect(meter).toHaveAttribute("aria-valuenow", "0");
    await populateWithPreviousBallot(ref);
    expect(meter).toHaveAttribute("aria-valuenow", "18");
    expect(meter).toHaveAttribute("aria-valuetext", "18 of 25");
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

    await populateWithPreviousBallot(ref);

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

  it("saves changes with PATCH in edit mode", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Ballot updated successfully" }),
    });

    const user = userEvent.setup();
    render(
      <EditTop25
        schools={makeSchools(25)}
        currentBallot={makePreviousBallot(25)}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Save changes/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/vote/college/football/rankings/fbs",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("resolves edit-mode toast fallbacks", async () => {
    const toastMessages: {
      success?: (data: { message?: string }) => string;
      error?: (err: Error) => string;
    } = {};

    vi.mocked(toast.promise).mockImplementation(((
      promise: any,
      messages: any,
    ) => {
      Object.assign(toastMessages, messages);
      return (typeof promise === "function" ? promise() : promise).catch(
        () => undefined,
      );
    }) as never);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const user = userEvent.setup();
    render(
      <EditTop25
        schools={makeSchools(25)}
        currentBallot={makePreviousBallot(25)}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Save changes/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => {
      expect(toastMessages.success?.({})).toBe("Ballot updated successfully");
    });
    expect(toastMessages.error?.(new Error(""))).toBe(
      "An error occurred while saving your ballot",
    );
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

    await populateWithPreviousBallot(ref);

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

  it("fires ballot_started once on the first manual edit, not on prefill", async () => {
    const ref = createRef<Top25FormRef>();

    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(25)}
      />,
    );

    await populateWithPreviousBallot(ref);
    expect(mockCapture).not.toHaveBeenCalledWith(
      "ballot_started",
      expect.anything(),
    );

    fireEvent.change(rankInput(1), { target: { value: "x" } });
    fireEvent.change(rankInput(2), { target: { value: "y" } });

    expect(
      mockCapture.mock.calls.filter(([event]) => event === "ballot_started"),
    ).toHaveLength(1);
  });

  it("rejects a ballot that ranks a team twice", () => {
    const values = Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [
        `rank_${index + 1}`,
        `school-${index + 1}`,
      ]),
    );
    const result = formSchema.safeParse({ ...values, rank_2: "school-1" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Duplicate team selected for rank 1",
        "Duplicate team selected for rank 2",
      ]),
    );
  });

  it("uses fallback error message when error response JSON fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => {
        throw new Error("invalid json");
      },
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

    await populateWithPreviousBallot(ref);

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
          error_message: "Unknown error",
        }),
      );
    });
  });

  it("uses HTTP status text when error payload omits a message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({}),
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

    await populateWithPreviousBallot(ref);

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
          error_message: "HTTP 500: Server Error",
        }),
      );
    });
  });

  it("resolves toast messages for success and error responses", async () => {
    const toastMessages: {
      success?: (data: { message?: string }) => string;
      error?: (err: Error) => string;
    } = {};

    vi.mocked(toast.promise).mockImplementation(((
      promise: any,
      messages: any,
    ) => {
      Object.assign(toastMessages, messages);
      return (typeof promise === "function" ? promise() : promise).catch(
        () => undefined,
      );
    }) as never);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
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

    await populateWithPreviousBallot(ref);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Submit$/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    await waitFor(() => {
      expect(toastMessages.success?.({})).toBe("Ballot submitted successfully");
    });

    expect(toastMessages.error?.(new Error(""))).toBe(
      "An error occurred while submitting your ballot",
    );
    expect(toastMessages.error?.(new Error("Custom failure"))).toBe(
      "Custom failure",
    );
  });

  it("validates each rank field when values are missing", () => {
    const result = formSchema.safeParse({});
    expect(result.success).toBe(false);

    if (!result.success) {
      for (let rank = 1; rank <= 25; rank += 1) {
        expect(
          result.error.issues.some((issue) =>
            issue.message.includes(`rank ${rank}`),
          ),
        ).toBe(true);
      }
    }
  });

  it("allows non-undefined invalid rank values without custom messages", () => {
    const values = Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [
        `rank_${index + 1}`,
        `school-${index + 1}`,
      ]),
    );

    const invalidValue = formSchema.shape.rank_1.safeParse(123);
    expect(invalidValue.success).toBe(false);
    if (!invalidValue.success) {
      expect(
        invalidValue.error.issues.every(
          (issue) => !issue.message?.includes("Please select a team"),
        ),
      ).toBe(true);
    }

    expect(formSchema.safeParse(values).success).toBe(true);
  });

  it("does not populate when previous ballot is empty", () => {
    const ref = createRef<Top25FormRef>();
    render(<Top25 ref={ref} schools={makeSchools(25)} previousBallot={[]} />);

    ref.current?.populateWithPreviousBallot();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows the submitting state while the ballot posts", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const ref = createRef<Top25FormRef>();
    const user = userEvent.setup();

    render(
      <Top25
        ref={ref}
        schools={makeSchools(25)}
        previousBallot={makePreviousBallot(25)}
      />,
    );

    await populateWithPreviousBallot(ref);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Submit$/i }),
      ).not.toBeDisabled();
    });

    const submitButton = screen.getByRole("button", { name: /^Submit$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/Submitting Ballot/i);
    });

    resolveFetch?.({
      ok: true,
      json: async () => ({ message: "Saved" }),
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("uses the API success message in toast callbacks", async () => {
    const toastMessages: {
      success?: (data: { message?: string }) => string;
    } = {};

    vi.mocked(toast.promise).mockImplementation(((
      promise: any,
      messages: any,
    ) => {
      Object.assign(toastMessages, messages);
      return (typeof promise === "function" ? promise() : promise).catch(
        () => undefined,
      );
    }) as never);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Custom success" }),
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

    await populateWithPreviousBallot(ref);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^Submit$/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /^Submit$/i }));

    await waitFor(() => {
      expect(toastMessages.success?.({ message: "Custom success" })).toBe(
        "Custom success",
      );
    });
  });
});

describe("Top25 form ordering", () => {
  beforeEach(() => {
    vi.mocked(toast).mockReset();
    mockCapture.mockReset();
  });

  function renderBallot(picks: number, schools = 26) {
    render(
      <EditTop25
        schools={makeSchools(schools)}
        currentBallot={makePreviousBallot(picks)}
      />,
    );
  }

  it("fills an empty slot", () => {
    renderBallot(3);
    fireEvent.change(rankInput(4), { target: { value: "school-9" } });
    expect(ranks(5)).toEqual([
      "school-1",
      "school-2",
      "school-3",
      "school-9",
      "",
    ]);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "4");
  });

  it("inserts into a filled slot and shifts the picks below down", () => {
    renderBallot(3);
    fireEvent.change(rankInput(1), { target: { value: "school-9" } });
    expect(ranks(5)).toEqual([
      "school-9",
      "school-1",
      "school-2",
      "school-3",
      "",
    ]);
    expect(toast).not.toHaveBeenCalled();
    expect(rankInput(1)).toHaveFocus();
  });

  it("moves a team already on the ballot and closes the gap it left", () => {
    renderBallot(5);
    fireEvent.change(rankInput(2), { target: { value: "school-4" } });
    expect(ranks(5)).toEqual([
      "school-1",
      "school-4",
      "school-2",
      "school-3",
      "school-5",
    ]);
  });

  it("offers Undo when an insert pushes a team off a full ballot", () => {
    renderBallot(25);
    fireEvent.change(rankInput(3), { target: { value: "school-26" } });
    expect(ranks()[2]).toBe("school-26");
    expect(ranks()[24]).toBe("school-24");
    expect(toast).toHaveBeenCalledWith("S25 dropped off", {
      action: { label: "Undo", onAction: expect.any(Function) },
    });

    const [, options] = vi.mocked(toast).mock.calls[0] as unknown as [
      string,
      { action: { onAction: () => void } },
    ];
    act(() => options.action.onAction());
    expect(ranks()[2]).toBe("school-3");
    expect(ranks()[24]).toBe("school-25");
  });

  it("removes a pick without moving the others and keeps focus on that rank", async () => {
    const user = userEvent.setup();
    renderBallot(3);
    await user.click(
      screen.getByRole("button", { name: "Remove S2 from rank 2" }),
    );
    expect(ranks(3)).toEqual(["school-1", "", "school-3"]);
    expect(rankInput(2)).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: /Remove S2/ }),
    ).not.toBeInTheDocument();
    expect(mockCapture).toHaveBeenCalledWith(
      "ballot_started",
      expect.anything(),
    );
  });

  it("clears a pick from the picker", () => {
    renderBallot(3);
    fireEvent.change(rankInput(1), { target: { value: "" } });
    expect(ranks(3)).toEqual(["", "school-2", "school-3"]);
  });

  it("moves a team with its up and down buttons", async () => {
    const user = userEvent.setup();
    renderBallot(3);
    await user.click(screen.getByRole("button", { name: "Move S3 up" }));
    expect(ranks(3)).toEqual(["school-1", "school-3", "school-2"]);
    await user.click(screen.getByRole("button", { name: "Move S1 down" }));
    expect(ranks(3)).toEqual(["school-3", "school-1", "school-2"]);
  });

  it("moves a team with Alt and the arrows, past empty slots", async () => {
    const user = userEvent.setup();
    renderBallot(2);
    await user.click(rankInput(2));
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(ranks(3)).toEqual(["school-1", "", "school-2"]);
    expect(rankInput(3)).toHaveFocus();
  });

  it("picks a team up by its reorder handle and drops it with Space", async () => {
    const user = userEvent.setup();
    renderBallot(3);
    screen.getByRole("button", { name: "Reorder S1" }).focus();
    await user.keyboard(" {ArrowDown}{ArrowDown} ");
    expect(ranks(3)).toEqual(["school-2", "school-3", "school-1"]);
  });

  it("names a school without a short name by its full name", () => {
    render(
      <EditTop25
        schools={[{ _id: "x", name: "Full Name U", shortName: null }] as never}
        currentBallot={[{ teamId: "x", rank: 1 }]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Remove Full Name U from rank 1" }),
    ).toBeVisible();
  });
});
