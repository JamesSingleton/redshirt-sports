import { CopyIcon } from "@sanity/icons";
import { Button, Popover, Text } from "@sanity/ui";
import copy from "copy-to-clipboard";
import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  url: string;
};

const ButtonAssetCopy = ({ disabled, url }: Props) => {
  const refPopoverTimeout = useRef<ReturnType<typeof window.setTimeout>>(null);
  const [popoverVisible, setPopoverVisible] = useState(false);

  const handleClick = () => {
    if (refPopoverTimeout.current) {
      clearTimeout(refPopoverTimeout.current);
    }

    setPopoverVisible(true);
    copy(url);

    refPopoverTimeout.current = setTimeout(() => {
      setPopoverVisible(false);
    }, 1250);
  };

  useEffect(() => {
    return () => {
      if (refPopoverTimeout.current) {
        clearTimeout(refPopoverTimeout.current);
      }
    };
  }, []);

  return (
    <Popover
      content={
        <Text muted size={1}>
          Copied!
        </Text>
      }
      open={popoverVisible}
      padding={2}
      placement="top"
      radius={1}
      portal
    >
      <Button
        disabled={disabled}
        fontSize={1}
        icon={CopyIcon}
        mode="ghost"
        onClick={handleClick}
        text="Copy URL"
      />
    </Popover>
  );
};

export default ButtonAssetCopy;
