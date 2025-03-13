import Tippy from "@tippyjs/react";
import React from "react";
import { Placement } from "@popperjs/core";

type Props = {
  children: React.ReactNode;
  className?: string;
  tippyContent?: string;
  tippyPlacement?: Placement;
};

const SideMenuButton: React.FC<Props> = ({
  children,
  className,
  tippyContent = "TippyMessage",
  tippyPlacement = "right",
}) => {
  return (
    <Tippy
      content={tippyContent}
      theme="custom"
      arrow={true}
      placement={tippyPlacement}
      delay={200}
    >
      <div className={`menuButton ${className}`}>{children}</div>
    </Tippy>
  );
};

export default SideMenuButton;
