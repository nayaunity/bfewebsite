import Link from "next/link";

export default function About() {
  return (
    <section id="about" className="bg-white">
      {/* Grid Section - like Generation She */}
      <div className="grid grid-cols-1 md:grid-cols-4">
        {/* Image Block */}
        <div className="aspect-square md:aspect-auto bg-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-100 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Yellow Block */}
        <div className="bg-[#ffe500] p-8 md:p-12 flex flex-col justify-center">
          <p className="text-sm tracking-wide">
            THE BLACK FEMALE ENGINEER IS
            <br />
            THE <span className="font-semibold">COMMUNITY</span>.
          </p>
          <p className="mt-6 text-sm tracking-wide">
            OUR RESOURCES ARE
            <br />
            <span className="font-semibold">FREE</span>.
          </p>
        </div>

        {/* Beige/Cream Block */}
        <div className="bg-[#f5f0e8] p-8 md:p-12 flex flex-col justify-center">
          <p className="text-sm tracking-wide leading-relaxed">
            TOGETHER WE&apos;RE
            <br />
            <span className="font-semibold">BUILDING CAREERS</span>
            <br />
            THAT ELEVATE
            <br />
            BLACK WOMEN
            <br />
            ACROSS <span className="font-semibold">TECH</span>,
            <br />
            <span className="font-semibold">ENGINEERING</span>, AND
            <br />
            <span className="font-semibold">STEM</span>.
          </p>
        </div>

        {/* CTA Block */}
        <div className="bg-white p-8 md:p-12 flex items-center justify-center border-l border-gray-100">
          <Link
            href="#community"
            className="border-2 border-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#ffe500] transition-colors text-center"
          >
            JOIN US
          </Link>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-16 md:py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm tracking-widest mb-12">
            WE&apos;VE PARTNERED WITH SOME PRETTY GREAT COMPANIES
          </p>

          {/* Partner Logos as Text - Row 1 */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 mb-6 font-serif text-3xl md:text-5xl">
            <span>ADOBE</span>
            <span className="text-[#ef562a]">GOOGLE</span>
            <span>MICROSOFT</span>
            <span>META</span>
          </div>

          {/* Partner Logos as Text - Row 2 */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 mb-6 font-serif text-3xl md:text-5xl">
            <span>AMAZON</span>
            <span className="text-[#ef562a]">NETFLIX</span>
            <span>STRIPE</span>
            <span>APPLE</span>
          </div>

          {/* Partner Logos as Text - Row 3 */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-3xl md:text-5xl">
            <span>SPOTIFY</span>
            <span>SALESFORCE</span>
            <span className="text-[#ef562a]">IBM</span>
            <span>NVIDIA</span>
          </div>

          <p className="text-center mt-12 text-sm">
            WANT TO PARTNER WITH US?{" "}
            <Link href="#contact" className="underline hover:text-[#ef562a]">
              LET US KNOW
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
