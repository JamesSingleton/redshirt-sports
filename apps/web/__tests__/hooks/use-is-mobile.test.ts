import { act, renderHook } from "@testing-library/react";

import { useIsMobile } from "@/hooks/use-is-mobile";

describe("useIsMobile", () => {
  let listeners: Array<(event: MediaQueryListEvent) => void>;
  let matches: boolean;

  beforeEach(() => {
    listeners = [];
    matches = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.push(listener);
        },
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners = listeners.filter((l) => l !== listener);
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("starts as null then syncs to matchMedia", () => {
    matches = true;
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const { result } = renderHook(() => useIsMobile(640));

    expect(result.current).toBe(false);

    act(() => {
      listeners[0]?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  it("cleans up the media listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners).toHaveLength(1);
    unmount();
    expect(listeners).toHaveLength(0);
  });

  it("skips setup when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBeNull();
  });
});
