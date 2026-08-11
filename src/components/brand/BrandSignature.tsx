interface BrandSignatureProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
};

export default function BrandSignature({
  size = "md",
  className = "",
}: BrandSignatureProps) {
  return (
    <span
      className={`font-script text-[var(--accent)] ${sizes[size]} ${className}`}
    >
      Nyaradzo Bere
    </span>
  );
}
