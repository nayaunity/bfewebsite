function ResumePreview() {
  return (
    <div className="bg-white border border-[#f5e6d3] rounded-xl p-3.5" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
      <div className="flex gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-lg bg-[#4d1b27]" />
        <div className="flex-1">
          <div className="h-2 w-[60%] bg-[#2a2828] rounded-full" />
          <div className="h-1.5 w-[40%] bg-[#d6d3d1] rounded-full mt-1" />
        </div>
      </div>
      {[80, 55, 92, 70, 40].map((w, i) => (
        <div
          key={i}
          className="h-[5px] rounded-full mb-[5px]"
          style={{ width: `${w}%`, background: i === 2 ? "#fbbf24" : "#e7e5e4" }}
        />
      ))}
      <div className="mt-2 px-2.5 py-1.5 bg-[#fff7ed] rounded-md text-[11px] text-[#9a3412] font-semibold">
        ✓ Parsed 14 skills · 6 years experience
      </div>
    </div>
  );
}

function MatchPreview() {
  const items = [
    { c: "Stripe", r: "Sr Frontend Eng", m: 96 },
    { c: "Figma", r: "Product Engineer", m: 94 },
    { c: "Anthropic", r: "ML Engineer", m: 91 },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, k) => (
        <div key={k} className="bg-white border border-[#f5e6d3] rounded-[10px] px-3 py-2.5 flex items-center gap-2.5" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div className="w-7 h-7 rounded-md bg-[#2a2828] text-white grid place-items-center text-[11px] font-bold">
            {item.c[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#2a2828]">{item.r}</div>
            <div className="text-[10px] text-[#78716c]">{item.c}</div>
          </div>
          <div className="text-[11px] font-bold text-[#10b981] bg-[#dcfce7] px-[7px] py-[3px] rounded-full">
            {item.m}%
          </div>
        </div>
      ))}
    </div>
  );
}

function ApplyPreview() {
  return (
    <div className="bg-[#2a2828] rounded-xl p-3.5 text-white font-mono text-[11px]">
      <div className="flex gap-[5px] mb-2.5">
        <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
        <div className="w-2 h-2 rounded-full bg-[#fbbf24]" />
        <div className="w-2 h-2 rounded-full bg-[#10b981]" />
      </div>
      <div className="text-[#a8a29e]">$ bfe apply --to stripe</div>
      <div className="text-[#10b981] mt-1">✓ Tailoring resume for &quot;Sr Frontend&quot;</div>
      <div className="text-[#10b981]">✓ Drafting cover letter</div>
      <div className="text-[#fbbf24]">→ Submitting to careers.stripe.com</div>
      <div className="text-[#10b981] mt-1">✓ Application #1,843 sent</div>
      <div className="text-[#a8a29e] mt-1.5 text-[10px]">completed in 4.2s</div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    t: "Drop your resume.",
    d: "We read it like a recruiter would, except in 0.4 seconds and without judgement about your gap year.",
    accent: "#4d1b27",
    fig: <ResumePreview />,
  },
  {
    n: "02",
    t: "We find your best fits.",
    d: "Every morning, fresh roles from 200+ top companies matched to your skills and preferences.",
    accent: "#2a2828",
    fig: <MatchPreview />,
  },
  {
    n: "03",
    t: "We apply. Real apps.",
    d: "Tailored resume submitted on the actual careers page. Just like you would. Except at midnight. While you sleep.",
    accent: "#4d1b27",
    fig: <ApplyPreview />,
  },
];

export default function HowItWorksEditorial() {
  return (
    <section id="how" className="py-20 md:py-[110px] px-4 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16 md:mb-[70px]">
          <div className="text-[13px] text-[#9a3412] tracking-[1.8px] font-bold mb-4">THE WHOLE THING</div>
          <h2
            className="font-serif font-medium leading-none tracking-[-1.5px] m-0"
            style={{ fontSize: "clamp(40px, 5.2vw, 72px)" }}
          >
            Three steps.<br />
            <span className="italic text-[#4d1b27]">Then you go live your life.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="bg-white border border-[#f0e6d6] rounded-[18px] p-8 flex flex-col"
            >
              <div
                className="font-serif italic leading-none mb-5"
                style={{ fontSize: 64, color: s.accent }}
              >
                {s.n}
              </div>
              <div className="mb-6 min-h-[160px] flex items-center">{s.fig}</div>
              <h3 className="font-serif text-[28px] font-medium tracking-[-0.5px] m-0">{s.t}</h3>
              <p className="text-[#52525b] text-[15px] leading-relaxed mt-3">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
