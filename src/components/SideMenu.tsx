import React from "react";
import { BookCheck, Home, NotebookPen, SquareAsterisk } from "lucide-react";
import SideMenuButton from "./SideMenuButton";

type Props = {};

const SideMenu: React.FC<Props> = () => {
  return (
    <section className="menu">
      <SideMenuButton className="mt-4">
        <Home size={18} strokeWidth={1.5} />
      </SideMenuButton>
      <SideMenuButton>
        <NotebookPen size={18} strokeWidth={1.5} />
      </SideMenuButton>
      <SideMenuButton>
        <BookCheck size={18} strokeWidth={1.5} />
      </SideMenuButton>
      <SideMenuButton>
        <SquareAsterisk size={18} strokeWidth={1.5} />
      </SideMenuButton>
    </section>
  );
};

export default SideMenu;
