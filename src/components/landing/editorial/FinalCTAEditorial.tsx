"use client";

import ResumeDrop from "./ResumeDrop";

export default function FinalCTAEditorial() {
  return (
    <section className="bg-[#2a2828] py-20 md:py-[120px] px-4 sm:px-8 relative overflow-hidden">
      <div className="max-w-[920px] mx-auto text-center">
        <div className="text-[13px] text-white/60 tracking-[1.5px] font-bold mb-6">
          GET YOUR TIME BACK
        </div>
        <h2
          className="font-serif font-medium leading-none text-white tracking-[-1.5px] m-0"
          style={{ fontSize: "clamp(40px, 6vw, 88px)" }}
        >
          Save 30+ hours a month.<br />
          <span className="italic text-[#4d1b27]">Spend them on what matters.</span>
        </h2>
        <p className="text-white/70 text-lg max-w-[620px] mx-auto mt-5 mb-9 leading-relaxed">
          You didn&apos;t spend years building your skills to waste weekends pasting
          the same info into forty forms. Let us handle the applications. You
          focus on what actually moves the needle: <i>your interviews</i>.
        </p>
        <div className="max-w-[540px] mx-auto">
          <ResumeDrop theme="dark" compact />
        </div>
        <div className="mt-6 text-[13px] text-white/50">
          7-day free trial · $0 charged today · Cancel in one click
        </div>
      </div>
    </section>
  );
}
