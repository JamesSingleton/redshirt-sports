import { useCallback } from "react";
import { type StringInputProps, set, unset } from "sanity";

const STATUS_URL = /(?:twitter|x)\.com\/[^/]+\/status(?:es)?\/(\d+)/i;

/**
 * Lets a writer paste the whole post URL from X; stores just the numeric id
 * the embed needs.
 */
export function PostIdInput(props: StringInputProps) {
  const { onChange, elementProps } = props;

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData("text");
      const id = pasted.match(STATUS_URL)?.[1];
      if (!id) return;
      event.preventDefault();
      onChange(id ? set(id) : unset());
    },
    [onChange],
  );

  return props.renderDefault({
    ...props,
    elementProps: { ...elementProps, onPaste: handlePaste },
  });
}
