"use client";

import { useState, useEffect } from "react";
import { LIVE_FEED } from "./liveFeedData";

export default function LiveFeedCard() {
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % LIVE_FEED.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="bg-white border border-[#f0e6d6] rounded-[20px] overflow-hidden"
      style={{
        boxShadow: "0 24px 60px -20px rgba(154, 52, 18, 0.18), 0 8px 24px -8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#f5e6d3] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="text-xs font-semibold tracking-[1px] text-[#9a3412]">LIVE FEED</span>
        </div>
        <div className="text-[11px] text-[#a8a29e]">updated just now</div>
      </div>

      {/* Feed */}
      <div className="p-2 max-h-[380px] overflow-hidden">
        {LIVE_FEED.map((item, i) => (
          <div
            key={i}
            className="px-3.5 py-3 rounded-[10px] flex items-center gap-3 transition-all duration-400"
            style={{
              background: i === tickerIdx ? "#fff7ed" : "transparent",
              transform: i === tickerIdx ? "translateX(4px)" : "none",
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#1a1a1a]">
                <span className="text-[#ef562a]">{item.name}</span> applied to {item.role}
              </div>
              <div className="text-xs text-[#78716c] mt-0.5">
                at <b>{item.company}</b> · {item.time}
              </div>
            </div>
            <div className="flex-shrink-0 bg-[#ecfccb] text-[#3f6212] text-xs font-bold px-2.5 py-1 rounded-full">
              {item.match}%
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-[#f5e6d3] text-xs text-[#78716c]">
        ↑ live applications by BFE users
      </div>
    </div>
  );
}
