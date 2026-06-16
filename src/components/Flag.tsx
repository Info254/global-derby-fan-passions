// Renders a team flag from either a URL (WC2026 dataset) or an emoji.
export function Flag({ src, alt, size = 18 }: { src?: string | null; alt: string; size?: number }) {
  if (!src) return <span>🏳️</span>;
  const isUrl = /^https?:\/\//i.test(src);
  if (isUrl) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={Math.round(size * 0.66)}
        loading="lazy"
        className="inline-block rounded-[2px] align-[-3px] mx-0.5 shadow-sm"
        style={{ width: size, height: "auto" }}
      />
    );
  }
  return <span className="align-middle">{src}</span>;
}
