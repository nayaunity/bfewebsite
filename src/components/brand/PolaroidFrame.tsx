import Image from "next/image";

interface PolaroidFrameProps {
  src: string;
  alt: string;
  caption?: string;
  rotation?: number;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function PolaroidFrame({
  src,
  alt,
  caption,
  rotation = 0,
  width,
  height,
  className = "",
  priority = false,
}: PolaroidFrameProps) {
  return (
    <div
      className={`bg-white dark:bg-[var(--dark-card-bg)] p-2 pb-8 shadow-lg ${className}`}
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
    >
      <div className="relative overflow-hidden aspect-[4/5]">
        {width && height ? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="object-cover w-full h-full"
            priority={priority}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={priority}
          />
        )}
      </div>
      {caption && (
        <p className="font-script text-center text-[var(--accent)] text-lg mt-3">
          {caption}
        </p>
      )}
    </div>
  );
}
