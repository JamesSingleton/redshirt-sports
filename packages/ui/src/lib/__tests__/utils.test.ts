import { whenSelected } from "../utils";

describe("whenSelected", () => {
  it("passes a chosen value through and drops an empty selection", () => {
    const handler = vi.fn();
    const onValueChange = whenSelected<string>(handler);
    onValueChange("fbs");
    onValueChange(null);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("fbs");
  });
});
