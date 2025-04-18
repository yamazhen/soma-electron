import { useState } from "react";

export const useQuizState = () => {
  const [inQuizListing, setInQuizListing] = useState<boolean>(true);
  const [inQuizReview, setInQuizReview] = useState<boolean>(false);

  const clickQuizListing = () => {
    setInQuizListing(true);
    setInQuizReview(false);
  };

  const clickQuizReview = () => {
    setInQuizReview((prev) => !prev);
    setInQuizListing(false);
  };

  return {
    inQuizListing,
    setInQuizListing,
    clickQuizListing,
    clickQuizReview,
    inQuizReview,
    setInQuizReview,
  };
};
