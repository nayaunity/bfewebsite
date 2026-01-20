"use client";

import Image from "next/image";

interface LinkCardProps {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  featured?: boolean;
}

export function LinkCard({ id, title, description, url, image, featured }: LinkCardProps) {
  const handleClick = () => {
    // Fire and forget - log the click without blocking navigation
    fetch("/api/links/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkId: id,
        linkTitle: title,
        linkUrl: url,
      }),
    }).catch(() => {
      // Silently fail - don't block the user
    });
  };

  const isExternal = url.startsWith("http");

  if (featured) {
    return (
      <a
        href={url}
        onClick={handleClick}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block bg-[#ffe500] dark:bg-[#ef562a] text-black dark:text-white p-5 rounded-2xl hover:bg-[#f5dc00] dark:hover:bg-[#d94a22] transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {image && (
              <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
                <Image
                  src={image}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-serif text-xl">{title}</h3>
              {description && (
                <p className="text-black/70 dark:text-white/70 text-sm mt-1">{description}</p>
              )}
            </div>
          </div>
          <svg
            className="w-5 h-5 flex-shrink-0 ml-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="block bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl hover:border-[#ffe500] transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {image && (
            <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={image}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="font-serif text-lg group-hover:text-[#ef562a] transition-colors">{title}</h3>
            {description && (
              <p className="text-[var(--gray-600)] text-sm mt-1">{description}</p>
            )}
          </div>
        </div>
        <svg
          className="w-5 h-5 flex-shrink-0 ml-4 text-[var(--gray-600)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </a>
  );
}
