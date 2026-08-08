import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

function TestProviders({ children }: { children: ReactNode }) {
  return <div data-testid="test-providers">{children}</div>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, { wrapper: TestProviders, ...options });
}
