import { render } from "@testing-library/react";
import type { ReactNode } from "react";

const { rootProps } = vi.hoisted(() => ({
  rootProps: {
    current: null as null | { onValueChange: (next: unknown) => void },
  },
}));

vi.mock("@redshirt-sports/ui/components/combobox", () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => (
    <>{typeof children === "function" ? null : children}</>
  );
  return {
    Combobox: (props: {
      children: ReactNode;
      onValueChange: (next: unknown) => void;
    }) => {
      rootProps.current = props;
      return <>{props.children}</>;
    },
    ComboboxContent: Passthrough,
    ComboboxEmpty: Passthrough,
    ComboboxInput: () => null,
    ComboboxItem: Passthrough,
    ComboboxList: Passthrough,
    ComboboxTrigger: Passthrough,
  };
});

import { FilterCombobox } from "@/components/filter-combobox";

describe("FilterCombobox selection changes", () => {
  it("ignores a cleared selection and forwards a picked one", () => {
    const onValueChange = vi.fn();
    render(
      <FilterCombobox
        label="Conference"
        options={[{ value: "mvfc", label: "MVFC" }]}
        value="mvfc"
        onValueChange={onValueChange}
      />,
    );

    rootProps.current?.onValueChange(null);
    expect(onValueChange).not.toHaveBeenCalled();

    rootProps.current?.onValueChange({ value: "mvfc", label: "MVFC" });
    expect(onValueChange).toHaveBeenCalledWith("mvfc");
  });
});
