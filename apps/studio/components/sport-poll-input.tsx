import { type StringInputProps, useFormValue } from "sanity";

import { pollOptionsForSport } from "../utils/sport-polls";

/** Poll dropdown limited to the polls that exist for the sport being edited. */
export function SportPollInput(props: StringInputProps) {
  const sportSlug = useFormValue(["slug", "current"]) as string | undefined;

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        ...props.schemaType.options,
        list: pollOptionsForSport(sportSlug),
      },
    },
  });
}
