import Tippy from "@tippyjs/react";
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  tippyContent?: string;
};

const SideMenuButton: React.FC<Props> = ({
  children,
  className,
  tippyContent = "TippyMessage",
}) => {
  return (
    <Tippy
      content={tippyContent}
      theme="custom"
      arrow={true}
      placement="right"
      delay={200}
    >
      <div className={`menuButton ${className}`}>{children}</div>
    </Tippy>
  );
};

export default SideMenuButton;
