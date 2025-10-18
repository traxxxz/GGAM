import React from 'react';

interface RiddleDisplayProps {
  riddleText: string;
}

export const RiddleDisplay: React.FC<RiddleDisplayProps> = ({ riddleText }) => {
  return (
    <div className="bg-slate-900/70 p-6 rounded-lg border border-slate-700 text-center">
      <p className="text-xl md:text-2xl leading-relaxed text-slate-200">
        {riddleText}
      </p>
    </div>
  );
};