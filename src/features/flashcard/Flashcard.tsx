import React from "react";
import { useAppContext } from "../../context/AppContext";
import CardListing from "./CardListing";
import CardReview from "./CardReview";

const Flashcard: React.FC = () => {
  const { inFCListing, inFCReview } = useAppContext();
  return (
    <section className="min-h-screen overflow-auto w-full">
      <div className="container py-20 px-6 flex flex-col justify-center items-center">
        {inFCListing && !inFCReview ? <CardListing /> : <CardReview />}
      </div>
    </section>
  );
};

export default Flashcard;
