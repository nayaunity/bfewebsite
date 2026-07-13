"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "./liveFeedData";

export default function FAQEditorial() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="py-20 md:py-[110px] px-4 sm:px-8">
      <div className="max-w-[880px] mx-auto">
        <div className="text-center mb-16 md:mb-[70px]">
          <div className="text-[13px] text-[#9a3412] tracking-[1.8px] font-bold mb-4">FAQ</div>
          <h2
            className="font-serif font-medium leading-none tracking-[-1.5px] m-0"
            style={{ fontSize: "clamp(40px, 5.2vw, 72px)" }}
          >
            The skeptical questions.<br />
            <span className="italic text-[#4d1b27]">Answered honestly.</span>
          </h2>
        </div>

        <div>
          {FAQ_ITEMS.map((f, i) => (
            <div
              key={i}
              className="border-b border-[#f0e6d6] py-7 cursor-pointer"
              onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            >
              <div className="flex items-center justify-between">
                <div className="font-serif text-[22px] text-[#2a2828] pr-4">{f.q}</div>
                <div
                  className="text-[28px] text-[#4d1b27] leading-none font-light transition-transform duration-200 flex-shrink-0"
                  style={{ transform: openIdx === i ? "rotate(45deg)" : "rotate(0)" }}
                >
                  +
                </div>
              </div>
              {openIdx === i && (
                <p className="text-[17px] text-[#3a3a3a] leading-relaxed mt-3.5 mb-0 max-w-[720px]">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
