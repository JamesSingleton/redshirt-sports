import { isPreviewSession } from "@/lib/is-preview-session";

describe("isPreviewSession", () => {
  const originalSelf = window.self;
  const originalTop = window.top;

  afterEach(() => {
    Object.defineProperty(window, "self", {
      value: originalSelf,
      configurable: true,
    });
    Object.defineProperty(window, "top", {
      value: originalTop,
      configurable: true,
    });
    document.cookie = "";
  });

  it("returns false when not in an iframe and no preview cookies exist", () => {
    Object.defineProperty(window, "self", {
      value: window,
      configurable: true,
    });
    Object.defineProperty(window, "top", { value: window, configurable: true });

    expect(isPreviewSession()).toBe(false);
  });

  it("returns true when the page is embedded in an iframe", () => {
    const iframeTop = {} as Window;
    Object.defineProperty(window, "self", {
      value: window,
      configurable: true,
    });
    Object.defineProperty(window, "top", {
      value: iframeTop,
      configurable: true,
    });

    expect(isPreviewSession()).toBe(true);
  });

  it("returns true when the Next.js draft mode cookie is present", () => {
    Object.defineProperty(window, "self", {
      value: window,
      configurable: true,
    });
    Object.defineProperty(window, "top", { value: window, configurable: true });
    document.cookie = "__prerender_bypass=1";

    expect(isPreviewSession()).toBe(true);
  });

  it("returns true when the Sanity preview perspective cookie is present", () => {
    Object.defineProperty(window, "self", {
      value: window,
      configurable: true,
    });
    Object.defineProperty(window, "top", { value: window, configurable: true });
    document.cookie = "sanity-preview-perspective=drafts";

    expect(isPreviewSession()).toBe(true);
  });

  it("returns false on the server when window is undefined", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate server environment
    delete globalThis.window;

    vi.resetModules();
    const { isPreviewSession: serverIsPreviewSession } = await import(
      "@/lib/is-preview-session"
    );

    expect(serverIsPreviewSession()).toBe(false);

    globalThis.window = originalWindow;
    vi.resetModules();
  });
});
