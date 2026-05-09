import { COMPANIES } from "../companyData";

export default function CompanyMarquee() {
  return (
    <section id="companies" className="py-10 border-t border-b border-[#f0e6d6] bg-white">
      <div className="text-center mb-5">
        <span className="text-xs text-[#9a3412] tracking-[1.5px] font-bold">APPLYING FOR YOU AT</span>
      </div>
      <div className="overflow-hidden marquee-mask">
        <div className="flex gap-14 animate-marquee-editorial w-max">
          {[...COMPANIES, ...COMPANIES].map((c, i) => (
            <div
              key={i}
              className="font-serif italic text-2xl md:text-4xl text-[#1a1a1a] flex-shrink-0 select-none"
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
