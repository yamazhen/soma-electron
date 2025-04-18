import React from "react";

type Props = {
  cardSetName: string;
  cardSetCount: number;
};

const CardSet: React.FC<Props> = ({ cardSetName, cardSetCount }) => {
  return (
    <div>
      <div className="relative h-[340px] w-[240px] cursor-pointer group">
        <div className="absolute bg-soma-light rounded-lg shadow-md p-6 w-[200px] h-[300px] flex items-center justify-center transform transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:translate-x-[-8px] group-hover:translate-y-[5px]"></div>
        <div className="absolute bg-soma-light rounded-lg shadow-md p-6 w-[200px] h-[300px] flex items-center justify-center transform transition-transform duration-300 group-hover:rotate-[-2deg] group-hover:translate-x-[-3px] group-hover:translate-y-[2px]"></div>
        <div className="absolute bg-soma-light rounded-lg shadow-md p-6 w-[200px] h-[300px] flex items-center justify-center"></div>
        <div className="absolute bg-soma-light rounded-lg shadow-md p-6 w-[200px] h-[300px] flex items-center justify-center transform transition-transform duration-300 group-hover:rotate-[2deg] group-hover:translate-x-[3px] group-hover:translate-y-[2px]"></div>
        <div className="absolute bg-soma-light rounded-lg shadow-md p-6 w-[200px] h-[300px] flex items-center justify-center transform transition-transform duration-300 group-hover:rotate-[5deg] group-hover:translate-x-[8px] group-hover:translate-y-[5px] flex flex-col">
          <h1 className="text-2xl font-bold">{cardSetName}</h1>
          <p className="text-soma-lightest text-xs">
            {cardSetCount + " Cards"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardSet;
