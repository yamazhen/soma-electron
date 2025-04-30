import React from "react";
import { useAppContext } from "../../context/AppContext";
import CardListing from "./CardListing";
import CardReview from "./CardReview";
import CardSetView from "./CardSetView";
import CardCreateForm from "./CardCreateForm";

const Flashcard: React.FC = () => {
  const { cardView } = useAppContext();

  switch (cardView) {
    case "listing":
      return <CardListing />;
    case "review":
      return <CardReview />;
    case "viewing":
      return <CardSetView />;
    case "create":
      return <CardCreateForm />;
    default:
      return <CardListing />;
  }
};

export default Flashcard;
