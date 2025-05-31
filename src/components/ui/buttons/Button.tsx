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
  tippyContent,
  tippyPlacement = "right",
  onClick,
  dropdownItems,
}) => {
  if (!tippyContent || tippyContent === "") {
    return (
      <div className={`menuButton ${className}`} onClick={onClick}>
        {children}
      </div>
    );
  }
  if (!dropdownItems && tippyContent && tippyContent !== "") {
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
      <MenuItems
        anchor="bottom"
        className="w-56 bg-soma-dark rounded-lg shadow-xl border border-soma-light/10 py-1 mt-2 z-50"
      >
        {dropdownItems &&
          dropdownItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {sectionIdx > 0 && <div className="h-px bg-soma-light/10 my-1" />}
              {section.items.map((item, itemIdx) => (
                <MenuItem key={itemIdx}>
                  <button
                    disabled={item.disabled}
                    onClick={item.disabled ? undefined : item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      item.disabled
                        ? "text-soma-text-secondary opacity-50 cursor-not-allowed"
                        : "text-soma-text-secondary hover:text-soma-text-primary hover:bg-soma-light/10 data-[active]:bg-soma-light/10 data-[active]:text-soma-text-primary cursor-pointer"
                    }`}
                  >
                    {item.icon && (
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
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
