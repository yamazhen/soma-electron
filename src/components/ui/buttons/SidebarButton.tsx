import { Placement } from "@popperjs/core";
import Tippy from "@tippyjs/react";
import React from "react";

interface SidebarButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  tippyContent?: string;
  tippyPlacement?: Placement;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon: Icon,
  isActive = false,
  onClick,
  size = "md",
  variant = "primary",
  tippyContent,
  tippyPlacement = "right",
}) => {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? 16 : 18;

  if (tippyContent) {
    return (
      <Tippy
        content={tippyContent}
        theme="custom"
        arrow={true}
        placement={tippyPlacement}
        delay={200}
      >
        <div className="relative group flex justify-center">
          <button
            onClick={onClick}
            className={`
          ${sizeClasses} flex items-center justify-center
          rounded-lg transition-all duration-200 cursor-pointer
          ${
            variant === "primary"
              ? isActive
                ? "bg-soma-accent1 text-white shadow-lg shadow-soma-accent1/20"
                : "hover:bg-soma-light/10 text-soma-text-secondary hover:text-soma-text-primary"
              : isActive
                ? "bg-soma-light/20 text-soma-accent1"
                : "hover:bg-soma-light/5 text-soma-text-secondary hover:text-soma-text-primary"
          }
        `}
          >
            <Icon size={iconSize} strokeWidth={1} />
          </button>
        </div>
      </Tippy>
    );
  }

  return (
    <div className="relative group flex justify-center">
      <button
        onClick={onClick}
        className={`
          ${sizeClasses} flex items-center justify-center
          rounded-lg transition-all duration-200 cursor-pointer
          ${
            variant === "primary"
              ? isActive
                ? "bg-soma-accent1 text-white shadow-lg shadow-soma-accent1/20"
                : "hover:bg-soma-light/10 text-soma-text-secondary hover:text-soma-text-primary"
              : isActive
                ? "bg-soma-light/20 text-soma-accent1"
                : "hover:bg-soma-light/5 text-soma-text-secondary hover:text-soma-text-primary"
          }
        `}
      >
        <Icon size={iconSize} strokeWidth={1.8} />
      </button>
    </div>
  );
};

export default SidebarButton;
