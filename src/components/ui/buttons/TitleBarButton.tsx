import Tippy from "@tippyjs/react";
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  onClick: () => void;
  tippyContent?: string;
};

const TitleBarButton: React.FC<Props> = ({
  children,
  className,
  isActive,
  onClick,
  tippyContent = "TippyMessage",
}) => {
  return (
    <Tippy
      content={tippyContent}
      theme="custom"
      arrow={true}
      placement="bottom"
      delay={200}
    >
      <div
        onMouseDown={onClick}
        className={`titleBarButton ${className} ${isActive ? "!bg-soma-light" : ""}`}
      >
        {children}
      </div>
    </Tippy>
  );
};

export default TitleBarButton;
