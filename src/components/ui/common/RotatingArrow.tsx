import React from "react";
import { ArrowRight } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import Tippy from "@tippyjs/react";

interface Props {
  onClick: () => void;
  rotated?: boolean;
  className?: string;
}

const RotatingArrow: React.FC<Props> = ({
  onClick,
  rotated = false,
  className = "",
}) => {
  const { getMessage } = useAppContext();

  const tooltip = rotated
    ? getMessage("common.collapse")
    : getMessage("common.expand");

  return (
    <Tippy
      content={tooltip}
      theme="custom"
      arrow={true}
      placement="right"
      delay={200}
    >
      <div className="relative group flex justify-center">
        <button
          onClick={onClick}
          className={`
          w-8 h-8 flex items-center justify-center
          rounded-lg transition-all duration-200
          hover:bg-soma-light/5 text-soma-text-secondary hover:text-soma-text-primary
          ${className}
        `}
        >
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className={`transition-transform duration-200 ease-in-out ${
              rotated ? "-rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>
    </Tippy>
  );
};

export default RotatingArrow;
