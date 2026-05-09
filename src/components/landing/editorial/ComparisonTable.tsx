import { COMPARISON } from "./liveFeedData";

export default function ComparisonTable() {
  return (
    <section className="py-20 md:py-[110px] px-4 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16 md:mb-[70px]">
          <div className="text-[13px] text-[#9a3412] tracking-[1.8px] font-bold mb-4">VS. THE OLD WAY</div>
          <h2
            className="font-serif font-medium leading-none tracking-[-1.5px] m-0"
            style={{ fontSize: "clamp(40px, 5.2vw, 72px)" }}
          >
            You, alone, vs. <span className="italic text-[#ef562a]">you, with us.</span>
          </h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white border border-[#f0e6d6] rounded-[18px] overflow-hidden">
          {/* Header */}
          <div
            className="grid grid-cols-[1.5fr_1fr_1fr] px-8 py-5 border-b border-[#f0e6d6] bg-[#fdfaf6] text-xs tracking-[1.4px] font-bold"
          >
            <div />
            <div className="text-[#a8a29e]">YOU, MANUALLY</div>
            <div className="text-[#ef562a]">WITH BFE AUTO·APPLY</div>
          </div>
          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.5fr_1fr_1fr] px-8 py-5 border-b border-[#f5ede0] last:border-b-0 items-center"
            >
              <div className="font-semibold text-base text-[#1a1a1a]">{row.row}</div>
              <div className="text-[#78716c] text-[15px]">{row.manual}</div>
              <div className="text-[#1a1a1a] text-[15px] font-semibold">
                <span className="text-[#10b981] mr-1.5">✓</span>{row.us}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden flex flex-col gap-4">
          {COMPARISON.map((row, i) => (
            <div key={i} className="bg-white border border-[#f0e6d6] rounded-2xl p-5">
              <div className="font-semibold text-base text-[#1a1a1a] mb-3">{row.row}</div>
              <div className="flex flex-col gap-2">
                <div className="text-sm">
                  <span className="text-[11px] tracking-wider font-bold text-[#a8a29e] block mb-0.5">MANUALLY</span>
                  <span className="text-[#78716c]">{row.manual}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[11px] tracking-wider font-bold text-[#ef562a] block mb-0.5">WITH BFE</span>
                  <span className="text-[#1a1a1a] font-semibold">
                    <span className="text-[#10b981] mr-1">✓</span>{row.us}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
