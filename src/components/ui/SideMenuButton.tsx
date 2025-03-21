import Tippy from "@tippyjs/react";
import React from "react";
import { Placement } from "@popperjs/core";

type Props = {
  children: React.ReactNode;
  className?: string;
  tippyContent?: string;
  tippyPlacement?: Placement;
  onClick?: () => void;
};

const SideMenuButton: React.FC<Props> = ({
  children,
  className,
  tippyContent = "TippyMessage",
  tippyPlacement = "right",
  onClick,
}) => {
  return (
    <Tippy
      content={tippyContent}
      theme="custom"
      arrow={true}
      placement={tippyPlacement}
      delay={200}
    >
      <div className={`menuButton ${className}`} onClick={onClick}>
        {children}
      </div>
    </Tippy>
  );
};

export default SideMenuButton;
