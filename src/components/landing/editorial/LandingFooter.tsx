import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#fdfaf6] border-t border-[#f0e6d6] py-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-5 flex-wrap">
        <div className="font-serif text-lg">BFE Auto·Apply</div>
        <div className="flex gap-7 text-[13px] text-[#78716c]">
          <Link href="/privacy" className="hover:text-[#1a1a1a] transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-[#1a1a1a] transition-colors">Terms</Link>
          <Link href="/" className="hover:text-[#1a1a1a] transition-colors">About BFE</Link>
          <Link href="mailto:theblackfemaleengineer@gmail.com" className="hover:text-[#1a1a1a] transition-colors">Contact</Link>
        </div>
        <div className="text-xs text-[#a8a29e]">© 2026 The Black Female Engineer</div>
      </div>
    </footer>
  );
}
