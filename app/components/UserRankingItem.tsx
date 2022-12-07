export interface UserRankingItemProps {
  title: string;
  value?: number;
  className?: string;
}

export function UserRankingItem({
  title,
  value,
  className = "",
}: UserRankingItemProps) {
  return (
    <div className={`flex flex-1 flex-col items-center ${className}`}>
      <span className="text-16-bold text-bright-purple">{value ?? "-"}</span>
      <span className="text-14-medium whitespace-nowrap">{title}</span>
    </div>
  );
}
