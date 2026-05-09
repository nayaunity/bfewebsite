export default function PullQuote() {
  return (
    <section className="bg-[#1a1a1a] text-white py-20 md:py-[120px] px-4 sm:px-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-sm text-[#9a3412] tracking-[1.5px] font-bold mb-5">WHY BOTHER</div>
        <p
          className="font-serif font-normal leading-[1.25] text-[#fafaf9] m-0"
          style={{ fontSize: "clamp(28px, 3.4vw, 48px)" }}
        >
          The average tech job gets{" "}
          <span className="italic text-[#ffe500]">250 applications</span>.
          You&apos;re sending two a week. We send{" "}
          <span className="italic text-[#ffe500]">ten a night</span>,
          each with a resume rewritten for that exact job description,
          submitted in the window recruiters actually read.
        </p>
      </div>
    </section>
  );
}
