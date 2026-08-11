import Image from "next/image";

interface DoodleArrowProps {
  size?: number;
  className?: string;
  rotate?: number;
}

export default function DoodleArrow({
  size = 80,
  className = "",
  rotate = 0,
}: DoodleArrowProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size * (112 / 200),
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/brand/doodle-arrow.png"
        alt=""
        width={200}
        height={112}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}
