import { useState, useEffect } from "react";

export function ProductImage({ src, name, color, className }) {
  // If the URL is missing, null, empty, or uses the decommissioned Unsplash source service, fail immediately.
  const isInvalid = !src || src.includes("source.unsplash.com") || src === "null" || src === "undefined";
  const [failed, setFailed] = useState(isInvalid);

  useEffect(() => {
    setFailed(isInvalid);
  }, [src, isInvalid]);

  if (failed) {
    const initials = name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

    return (
      <div
        className={`flex items-center justify-center font-display font-bold text-white select-none ${className}`}
        style={{
          background: `linear-gradient(135deg, ${color || "#8C6A5C"} 0%, ${color ? color + "dd" : "#704F4F"} 100%)`,
        }}
      >
        <span className="text-sm tracking-wider opacity-90">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
