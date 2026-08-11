import Image from "next/image";

interface ChromeStarProps {
  size?: number;
  className?: string;
  variant?: "chrome" | "outline" | "filled";
  rotate?: number;
}

export default function ChromeStar({
  size = 48,
  className = "",
  rotate = 0,
}: ChromeStarProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/brand/chrome-star.png"
        alt=""
        width={200}
        height={192}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}
