import { useEffect, useState } from "react";

export const useUserState = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [userData, setUserData] = useState<UserStore | null>(null);
  const [startUp, setStartUp] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // check if user already logged in on startup
  useEffect(() => {
    if (!startUp) return;
    const startupCheck = async () => {
      setIsLoading(true);
      try {
        const user = await window.userData.loadOffline();
        if (user) {
          setLoggedIn(true);
          setUserData(user);
        } else {
          setUserData(null);
          setLoggedIn(false);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserData(null);
        setLoggedIn(false);
      } finally {
        setIsLoading(false);
        setStartUp(false);
      }
    };
    startupCheck();
  }, [startUp]);

  // logout and clean
  const logout = async () => {
    try {
      await window.userData.logout();
      setLoggedIn(false);
      setUserData(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
    }
  };

  // when user has internet connection
  const handleOnline = async () => {
    if (loggedIn) {
      const user = await window.userData.loadOnline();
      if (user) setUserData(user);
    }
    setIsOnline(true);
  };

  // when user has no internet connection
  const handleOffline = async () => {
    setIsOnline(false);
  };

  // when user logs in fetch from offline
  useEffect(() => {
    const handler = async () => {
      setIsLoading(true);
      try {
        const user = await window.userData.loadOffline();
        if (user) {
          setLoggedIn(true);
          setUserData(user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    window.ipcRenderer.on("user:update-from-offline", handler);
    return () => {
      window.ipcRenderer.off("user:update-from-offline", handler);
    };
  }, []);

  // update when user have internet connection
  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    loggedIn,
    setLoggedIn,
    isOnline,
    setIsOnline,
    userData,
    logout,
    isLoading,
    setIsLoading,
  };
};
