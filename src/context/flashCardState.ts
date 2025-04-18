import { useState } from "react";

export const useFlashCardState = () => {
  const [inFCListing, setInFCListing] = useState<boolean>(true);
  const [inFCReview, setInFCReview] = useState<boolean>(false);

  const clickFCListing = () => {
    setInFCListing(true);
    setInFCReview(false);
  };

  const clickFCReview = () => {
    setInFCListing(false);
    setInFCReview(true);
  };

  return {
    inFCReview,
    clickFCListing,
    clickFCReview,
    inFCListing,
    setInFCListing,
    setInFCReview,
  };
};
