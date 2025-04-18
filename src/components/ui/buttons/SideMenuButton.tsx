import Tippy from "@tippyjs/react";
import React from "react";
import { Placement } from "@popperjs/core";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

type MenuSection = {
  items: MenuItem[];
};

type Props = {
  children: React.ReactNode;
  className?: string;
  tippyContent?: string;
  tippyPlacement?: Placement;
  onClick?: () => void;
  dropdownItems?: MenuSection[];
};

const SideMenuButton: React.FC<Props> = ({
  children,
  className,
  tippyContent = "TippyMessage",
  tippyPlacement = "right",
  onClick,
  dropdownItems,
}) => {
  if (!dropdownItems) {
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
  }

  return (
    <Menu>
      <Tippy
        content={tippyContent}
        theme="custom"
        arrow={true}
        placement={tippyPlacement}
        delay={200}
      >
        <MenuButton as="div" className={`menuButton ${className}`}>
          {children}
        </MenuButton>
      </Tippy>

      <MenuItems anchor="bottom">
        {dropdownItems.map((section, sectionIdx) => (
          <div key={sectionIdx} className="dropDown">
            {section.items.map((item, itemIdx) => (
              <MenuItem key={itemIdx}>
                <button onClick={item.onClick} className="dropDownItem">
                  {item.icon && item.icon}
                  {item.label}
                </button>
              </MenuItem>
            ))}
          </div>
        ))}
      </MenuItems>
    </Menu>
  );
};

export default SideMenuButton;
