import { render, screen } from "@testing-library/react";

import { Providers } from "@/components/providers";

const mockThemeProvider = vi.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
);

vi.mock("next-themes", () => ({
  ThemeProvider: (props: { children: React.ReactNode }) =>
    mockThemeProvider(props),
}));

describe("Providers", () => {
  it("wraps children in the theme provider with expected defaults", () => {
    render(
      <Providers>
        <span>App content</span>
      </Providers>,
    );

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByText("App content")).toBeInTheDocument();
    expect(mockThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        attribute: "class",
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: true,
        enableColorScheme: true,
      }),
    );
  });
});
