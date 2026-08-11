import ChromeStar from "./ChromeStar";

interface SparkleGroupProps {
  className?: string;
  scale?: "sm" | "md" | "lg";
}

const scales = {
  sm: { star1: 28, star2: 18, star3: 12 },
  md: { star1: 48, star2: 28, star3: 16 },
  lg: { star1: 64, star2: 36, star3: 20 },
};

export default function SparkleGroup({ className = "", scale = "md" }: SparkleGroupProps) {
  const s = scales[scale];
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <ChromeStar size={s.star1} rotate={0} className="animate-twinkle" />
      <ChromeStar
        size={s.star2}
        rotate={20}
        className="absolute -top-3 -right-8 animate-twinkle [animation-delay:0.8s]"
      />
      <ChromeStar
        size={s.star3}
        rotate={-15}
        className="absolute top-8 -right-2 animate-twinkle [animation-delay:1.5s]"
      />
    </div>
  );
}
