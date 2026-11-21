import { CONFIRM_MESSAGES, confirmState } from "@/lib/newsletter/signup";

describe("confirmState", () => {
  it("maps each confirm outcome to its message", () => {
    expect(confirmState("confirmed")).toBe(CONFIRM_MESSAGES.confirmed);
    expect(confirmState("invalid")).toMatchObject({ status: "error" });
  });

  it.each([null, "", "toString", "nope"])("is idle for %j", (status) => {
    expect(confirmState(status)).toEqual({ status: "idle" });
  });
});
