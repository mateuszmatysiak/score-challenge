export interface MatchCardTeamFlagProps {
  src?: string | null;
  alt?: string;
  size?: string;
}

export function MatchCardTeamFlag({
  src,
  alt,
  size = "40px",
}: MatchCardTeamFlagProps) {
  return src ? (
    <img
      src={src}
      alt={`${alt} Flag`}
      className={`w-[${size}] h-[${size}] rounded-full border-2 border-dark-blue object-cover`}
    />
  ) : (
    <div
      className={`w-[${size}] h-[${size}] rounded-full bg-grey border-2 border-dark-blue overflow-hidden`}
    />
  );
}
