import React from "react";
import { WalletCards, ChevronRight } from "lucide-react";

type Props = {
  cardSetName: string;
  cardSetCount: number;
};

const CardSet: React.FC<Props> = ({ cardSetName, cardSetCount }) => {
  return (
    <div className="bg-soma-dark rounded-xl p-5 hover:bg-soma-medium transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-soma-accent2/20 rounded-lg">
          <WalletCards className="text-soma-accent2" size={24} />
        </div>
        <ChevronRight
          className="text-soma-lightest group-hover:text-soma-text-primary transition-colors"
          size={20}
        />
      </div>

      <h3 className="text-lg font-semibold text-soma-text-primary mb-2">
        {cardSetName}
      </h3>

      <div className="flex items-center justify-between">
        <span className="text-soma-text-secondary text-sm">
          {cardSetCount} {cardSetCount === 1 ? "card" : "cards"}
        </span>
        <div
          className={`h-2 w-2 rounded-full ${cardSetCount > 0 ? "bg-soma-success" : "bg-soma-warning"}`}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-soma-light/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-soma-lightest">Last reviewed</span>
          <span className="text-soma-text-secondary">2 days ago</span>
        </div>
      </div>
    </div>
  );
};

export default CardSet;
