import { useEffect, useState } from "react";

export const useCurrentDate = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    const updateAtMidnight = () => {
      setCurrentDate(new Date());

      const now = new Date();
      const timeUntilMidnight =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          0,
          0,
          0,
          0,
        ).getTime() - now.getTime();

      const timeoutId = setTimeout(updateAtMidnight, timeUntilMidnight);
      return timeoutId;
    };

    const timeoutId = updateAtMidnight();

    return () => clearTimeout(timeoutId);
  }, []);
  return currentDate;
};
