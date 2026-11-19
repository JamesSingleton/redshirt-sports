import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../navigation-menu";

describe("NavigationMenu", () => {
  function renderMenu() {
    return render(
      <NavigationMenu aria-label="Site">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Football</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/football">
                Football news
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Basketball</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/basketball">
                Basketball news
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
  }

  it("moves the open panel with the pointer without focusing the trigger it left", async () => {
    const user = userEvent.setup();
    renderMenu();
    const football = screen.getByRole("button", { name: "Football" });
    const basketball = screen.getByRole("button", { name: "Basketball" });

    await user.hover(football);
    await waitFor(() => expect(football).toHaveAttribute("data-open"));

    await user.hover(basketball);
    await waitFor(() => expect(basketball).toHaveAttribute("data-open"));
    expect(football).not.toHaveAttribute("data-open");
    // Focus left on the old trigger shows its focus ring after the pointer moved on.
    expect(football).not.toHaveFocus();
    expect(document.activeElement).toBe(document.body);
  });
});
