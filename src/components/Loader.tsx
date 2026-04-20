import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full bg-cyan-500/10 animate-pulse blur-xl"></div>
        <div className="absolute w-20 h-20 rounded-full border border-cyan-400/20 animate-ping opacity-75"></div>
        <div className="relative w-16 h-16 rounded-full border-4 border-[#2a3a38] border-t-cyan-400 animate-spin z-10"></div>
        <div className="absolute w-3 h-3 bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(56,189,248,0.8)]"></div>
      </div>
    </div>
  );
};

export default Loader;
