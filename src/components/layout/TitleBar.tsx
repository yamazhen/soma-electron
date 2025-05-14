import { useAppContext } from "../../context/AppContext";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { User, Settings, LogOut, ChevronDown, WifiOff } from "lucide-react";

interface WindowState {
  isFullScreen: boolean;
  isMacOS: boolean;
}

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

interface DropdownSection {
  items: DropdownItem[];
}

const TitleBar = () => {
  const { loggedIn, activePage } = useAppContext();
  const [windowControlSpace, setWindowControlSpace] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleWindowStateChange = ({
      isFullScreen,
      isMacOS,
    }: WindowState) => {
      setWindowControlSpace(!isFullScreen && isMacOS);
    };

    const cleanup = window.ipcRenderer.onWindowStateChange(
      handleWindowStateChange,
    );

    return cleanup;
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSignOut = () => {
    // Add your sign out logic here
    console.log("Signing out...");
  };

  const handleSettings = () => {
    // Add your settings navigation logic here
    console.log("Opening settings...");
  };

  const dropdownItems: DropdownSection[] = [
    {
      items: [
        {
          label: "Settings",
          onClick: handleSettings,
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
    {
      items: [
        {
          label: "Sign Out",
          onClick: handleSignOut,
          icon: <LogOut className="w-4 h-4 text-red-400" />,
          className: "!text-red-400 hover:!text-red-300 hover:!bg-red-400/10",
        },
      ],
    },
  ];

  return (
    <header className="h-14 bg-soma-dark border-b border-soma-light/20">
      <div className="h-full flex items-center justify-between px-8">
        {/* Left: Logo and current page */}
        <div className="flex items-center gap-6">
          {/* Space for macOS window controls */}
          {windowControlSpace && <div className="w-10" />}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-soma-accent1 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-lg font-medium text-soma-text-primary">
              Soma
            </span>
          </div>

          <div className="hidden sm:block text-sm text-soma-text-secondary capitalize">
            {activePage}
          </div>
        </div>

        {/* Right: User info and status */}
        <div className="flex items-center gap-4">
          {/* Online/Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full">
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500">Offline</span>
            </div>
          )}

          {loggedIn ? (
            <Menu>
              <MenuButton className="flex items-center gap-3 hover:bg-soma-light/10 rounded-lg p-2 transition-colors cursor-pointer">
                <div className="text-right">
                  <p className="text-sm text-soma-text-primary">Bowen Chong</p>
                  <p className="text-xs text-soma-text-secondary">Creator</p>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTN7rEMddM-ZtHesWPtal57_zxw-TSdLMjFsw&s" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-soma-text-secondary" />
              </MenuButton>
              <MenuItems
                anchor="bottom"
                className="w-56 bg-soma-dark rounded-lg shadow-xl border border-soma-light/10 py-1 z-50"
              >
                {dropdownItems.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    {sectionIdx > 0 && (
                      <div className="h-px bg-soma-light/10 my-1" />
                    )}
                    {section.items.map((item, itemIdx) => (
                      <MenuItem key={itemIdx}>
                        <button
                          onClick={item.onClick}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            item.className ||
                            "text-soma-text-secondary hover:text-soma-text-primary hover:bg-soma-light/10 data-[active]:bg-soma-light/10 data-[active]:text-soma-text-primary"
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
          ) : (
            <div className="flex items-center gap-3">
              {isOnline ? (
                <button className="text-sm px-4 py-2 bg-soma-accent1 text-white rounded-lg hover:bg-opacity-90 transition-all">
                  Sign In
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-soma-text-secondary">
                  <User className="w-5 h-5" />
                  <span>Offline Mode</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TitleBar;
