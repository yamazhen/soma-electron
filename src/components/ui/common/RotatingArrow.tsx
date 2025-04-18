import { ArrowRight } from "lucide-react";
import React from "react";
import SideMenuButton from "../buttons/SideMenuButton";
import { useAppContext } from "../../../context/AppContext";

interface Props {
  onClick?: () => void;
  rotated?: boolean;
}

const RotatingArrow: React.FC<Props> = ({ onClick, rotated = false }) => {
  const { getMessage } = useAppContext();

  let tippyMessage = "";
  if (rotated) {
    tippyMessage = getMessage("common.collapse");
  } else {
    tippyMessage = getMessage("common.expand");
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
