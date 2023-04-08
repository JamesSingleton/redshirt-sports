import { useCallback } from "react";
import { Box, Stack, Text, TextInput } from "@sanity/ui";
import { set, unset } from "sanity";

const CustomStringInputWithLimits = (props) => {
  const { onChange, value = "", elementProps } = props;
  const handleChange = useCallback(
    (event) =>
      onChange(
        event.currentTarget.value ? set(event.currentTarget.value) : unset()
      ),
    [onChange]
  );
  return (
    <Stack space={3}>
      <TextInput {...elementProps} onChange={handleChange} value={value} />
      <Text size={1}>Characters: {value?.length || 0}</Text>
    </Stack>
  );
};

export default CustomStringInputWithLimits;
