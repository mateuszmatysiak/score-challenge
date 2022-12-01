export interface MatchCardTeamFlagProps {
  src?: string | null;
  alt?: string;
  type?: "small" | "large";
}

export function MatchCardTeamFlag({
  src,
  alt,
  type = "small",
}: MatchCardTeamFlagProps) {
  const size = type === "small" ? "10" : "24";

  return src ? (
    <img
      src={src}
      alt={`${alt} Flag`}
      className={`w-10 h-10 rounded-full border-2 border-dark-blue object-cover`}
    />
  ) : (
    <div
      className={`w-10 h-10 rounded-full bg-grey border-2 border-dark-blue overflow-hidden`}
    />
  );
}
