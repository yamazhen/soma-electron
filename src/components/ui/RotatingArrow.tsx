import { ArrowRight } from "lucide-react";
import React from "react";
import SideMenuButton from "./SideMenuButton";

interface Props {
  onClick?: () => void;
  rotated?: boolean;
}

const RotatingArrow: React.FC<Props> = ({ onClick, rotated = false }) => {
  let tippyMessage = "";
  if (rotated) {
    tippyMessage = "Collapse";
  } else {
    tippyMessage = "Expand";
  }
  return (
    <button onClick={onClick}>
      <SideMenuButton
        className="hover:!bg-transparent"
        tippyContent={tippyMessage}
      >
        <ArrowRight
          size={18}
          strokeWidth={1.5}
          className={`transition-transform duration-200 ease-in-out ${rotated ? "-rotate-180" : "rotate-0"}`}
        />
      </SideMenuButton>
    </button>
  );
};

export default RotatingArrow;
