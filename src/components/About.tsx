import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="bg-[var(--background)]">
      {/* Grid Section - like Generation She */}
      <div className="grid grid-cols-1 md:grid-cols-4">
        {/* Image Block */}
        <div className="aspect-square md:aspect-auto bg-[var(--gray-200)] relative overflow-hidden">
          <Image
            src="/images/bfeimage2.png"
            alt="Person working at computer with headphones"
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover"
          />
        </div>

        {/* Yellow Block */}
        <div className="bg-[#4d1b27] p-8 md:p-12 flex flex-col justify-center text-white">
          <p className="text-sm tracking-wide">
            HELPING YOU BUILD
            <br />
            <span className="font-semibold">SKILLS</span>, <span className="font-semibold">WEALTH</span>,
          </p>
          <p className="mt-6 text-sm tracking-wide">
            AND <span className="font-semibold">FREEDOM</span> WITH <span className="font-semibold">AI</span>.
          </p>
        </div>

        {/* Beige/Cream Block */}
        <div className="bg-[var(--gray-100)] p-8 md:p-12 flex flex-col justify-center">
          <p className="text-sm tracking-wide leading-relaxed">
            EQUIPPING YOU WITH
            <br />
            <span className="font-semibold">TOOLS</span> AND
            <br />
            <span className="font-semibold">STRATEGIES</span>
            <br />
            TO <span className="font-semibold">EARN MORE</span>,
            <br />
            <span className="font-semibold">LEARN FASTER</span>,
            <br />
            AND LIVE ON YOUR
            <br />
            <span className="font-semibold">OWN TERMS</span>.
          </p>
        </div>

        {/* CTA Block */}
        <div className="bg-[var(--background)] p-8 md:p-12 flex items-center justify-center border-l border-[var(--card-border)]">
          <Link
            href="#community"
            className="border-2 border-[var(--accent)] text-[var(--foreground)] px-8 py-4 rounded-full font-medium hover:bg-[#4d1b27] hover:text-white transition-colors text-center"
          >
            JOIN US
          </Link>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-16 md:py-20 border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm tracking-widest mb-12">
            I&apos;VE PARTNERED WITH SOME PRETTY GREAT COMPANIES
          </p>

          {/* Partner Logos as Text - Row 1 */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 mb-6 font-serif text-3xl md:text-5xl text-[var(--gray-300)]">
            <span className="text-[var(--accent)]">MICROSOFT</span>
            <span>ADOBE</span>
            <span>AMAZON</span>
            <span>HP</span>
          </div>

          {/* Partner Logos as Text - Row 2 */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 mb-6 font-serif text-3xl md:text-5xl text-[var(--gray-300)]">
            <span>TIKTOK</span>
            <span className="text-[var(--accent)]">LINKEDIN</span>
            <span>SAS</span>
            <span>CANVA</span>
          </div>

          {/* Partner Logos as Text - Row 3 */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 mb-6 font-serif text-3xl md:text-5xl text-[var(--gray-300)]">
            <span>JETBRAINS</span>
            <span>SERVICENOW</span>
            <span className="text-[var(--accent)]">ANTHROPIC</span>
            {/* <span>AFROTECH</span> */}
          </div>

          <p className="text-center mt-12 text-sm">
            WANT TO PARTNER WITH ME?{" "}
            <a href="/work-with-us" className="underline hover:text-[var(--accent)]">
              LET ME KNOW
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
