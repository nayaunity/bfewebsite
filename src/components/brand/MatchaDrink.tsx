import Image from "next/image";

interface MatchaDrinkProps {
  size?: number;
  className?: string;
  rotate?: number;
}

export default function MatchaDrink({
  size = 120,
  className = "",
  rotate = 0,
}: MatchaDrinkProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size * (200 / 176),
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/brand/matcha-drink.png"
        alt=""
        width={176}
        height={200}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}
