export interface MatchCardTeamFlagProps {
  src?: string | null;
  alt?: string;
  size: "small" | "large";
}

export function MatchCardTeamFlag({ src, alt, size }: MatchCardTeamFlagProps) {
  const imgSize = size === "large" ? "100px" : "40px";

  return src ? (
    <img
      src={src}
      alt={`${alt} Flag`}
      className={`w-[${imgSize}] h-[${imgSize}] rounded-full border-2 border-dark-blue object-cover`}
    />
  ) : (
    <div
      className={`w-[${imgSize}] h-[${imgSize}] rounded-full bg-grey border-2 border-dark-blue overflow-hidden`}
    />
  );
}
