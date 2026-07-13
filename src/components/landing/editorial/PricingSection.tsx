import Link from "next/link";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-[110px] px-4 sm:px-8 bg-[#fff7ed]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16 md:mb-[70px]">
          <div className="text-[13px] text-[#9a3412] tracking-[1.8px] font-bold mb-4">PRICING</div>
          <h2
            className="font-serif font-medium leading-none tracking-[-1.5px] m-0"
            style={{ fontSize: "clamp(40px, 5.2vw, 72px)" }}
          >
            Two plans.<br />
            <span className="italic text-[#4d1b27]">Both cheaper than a recruiter.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[880px] mx-auto">
          {/* Starter - Popular */}
          <div className="bg-[#2a2828] text-white rounded-[22px] p-9 flex flex-col relative">
            <div className="absolute top-5 right-6 bg-[#4d1b27] text-white text-[11px] font-bold px-3 py-[5px] rounded-full tracking-[0.8px]">
              MOST POPULAR
            </div>
            <div className="text-[13px] text-[#fbbf24] tracking-[1px] font-semibold">STARTER</div>
            <div className="font-serif text-[56px] mt-2 leading-none text-white">
              $29<span className="text-xl text-[#a8a29e]">/mo</span>
            </div>
            <div className="text-[#a8a29e] text-sm mt-1.5">100 tailored applications / month · 7-day free trial</div>
            <ul className="list-none p-0 my-6 flex-1 text-sm leading-8 text-[#e5e5e5]">
              <li><b className="text-white">100</b> auto-applies per month</li>
              <li>AI resume tailoring per role</li>
              <li>Smart resume matching</li>
              <li>Apply to 200+ top companies</li>
              <li>Application tracking</li>
            </ul>
            <Link
              href="/auto-apply/get-started"
              className="block text-center bg-[#4d1b27] text-white py-3.5 px-6 rounded-full font-bold text-[15px] hover:bg-[#f0d800] transition-colors"
            >
              Start 7-day free trial
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white border border-[#f0e6d6] rounded-[22px] p-9 flex flex-col relative">
            <div className="text-[13px] text-[#78716c] tracking-[1px] font-semibold">PRO</div>
            <div className="font-serif text-[56px] mt-2 leading-none">
              $59<span className="text-xl text-[#a8a29e]">/mo</span>
            </div>
            <div className="text-[#78716c] text-sm mt-1.5">300 tailored applications / month</div>
            <ul className="list-none p-0 my-6 flex-1 text-sm leading-8">
              <li><b>300</b> auto-applies per month</li>
              <li>Unlimited tailored resumes</li>
              <li>Upload up to 10 resumes</li>
              <li>Apply to 200+ top companies</li>
              <li>Priority queue + daily auto-apply</li>
            </ul>
            <Link
              href="/pricing"
              className="block text-center bg-white text-[#2a2828] py-3.5 px-6 rounded-full font-semibold text-[15px] border-[1.5px] border-[#2a2828] hover:bg-[#f5f5f5] transition-colors"
            >
              Get Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
