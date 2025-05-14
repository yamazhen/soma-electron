import { useState } from "react";

export const useUserState = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(true);
  const [hasConnection, setHasConnection] = useState<boolean>(false);

  return {
    loggedIn,
    setLoggedIn,
    hasConnection,
    setHasConnection,
  };
};
