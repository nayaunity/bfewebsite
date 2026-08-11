import Image from "next/image";

interface PinkFolderProps {
  size?: number;
  className?: string;
  rotate?: number;
}

export default function PinkFolder({
  size = 80,
  className = "",
  rotate = 0,
}: PinkFolderProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size * (166 / 200),
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/brand/pink-folder.png"
        alt=""
        width={200}
        height={166}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}
