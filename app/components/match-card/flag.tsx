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
  return src ? (
    <img
      src={src}
      alt={`${alt} Flag`}
      className={`${type === "small" ? "w-10" : "w-24"} ${
        type === "small" ? "h-10" : "h-24"
      } rounded-full border-2 border-dark-blue object-cover max-xl:w-10 max-xl:h-10 max-sm:w-6 max-sm:h-6`}
    />
  ) : (
    <div
      className={`${type === "small" ? "w-10" : "w-24"} ${
        type === "small" ? "h-10" : "h-24"
      } rounded-full bg-grey border-2 border-dark-blue overflow-hidden max-xl:w-10 max-xl:h-10 max-sm:w-6 max-sm:h-6`}
    />
  );
}
