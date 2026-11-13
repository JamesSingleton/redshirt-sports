import { downloadBlob } from "@/lib/download-blob";

describe("downloadBlob", () => {
  it("saves the blob through a temporary link and frees it", () => {
    vi.useFakeTimers();
    const create = vi.fn(() => "blob:bracket");
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const clicked: { href: string; download: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });

    const blob = new Blob(["png"]);
    downloadBlob(blob, "bracket.png");
    expect(create).toHaveBeenCalledWith(blob);
    expect(clicked).toEqual([
      { href: "blob:bracket", download: "bracket.png" },
    ]);
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:bracket");

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});
