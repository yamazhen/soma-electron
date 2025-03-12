import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  onClick: () => void;
};

const TitleBarButton: React.FC<Props> = ({
  children,
  className,
  isActive,
  onClick,
}) => {
  return (
    <div
      onMouseDown={onClick}
      className={`titleBarButton ${className} ${isActive ? "!bg-soma-light" : ""}`}
    >
      {children}
    </div>
  );
};

export default TitleBarButton;
