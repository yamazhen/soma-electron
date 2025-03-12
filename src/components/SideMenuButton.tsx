import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const SideMenuButton: React.FC<Props> = ({ children, className }) => {
  return <div className={`menuButton ${className}`}>{children}</div>;
};

export default SideMenuButton;
