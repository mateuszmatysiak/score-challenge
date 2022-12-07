import { UserRankingItem } from "./UserRankingItem";

export interface LoggedInUserRankingProps {
  rank?: number;
  groupPoints?: number;
  playoffPoints?: number;
  totalPoints?: number;
}

export function LoggedInUserRanking({
  rank,
  groupPoints,
  playoffPoints,
  totalPoints,
}: LoggedInUserRankingProps) {
  return (
    <div className="flex justify-between items-center flex-1 gap-2 bg-white px-12 max-xl:px-8 max-sm:px-4">
      <span className="text-16-medium whitespace-nowrap">Your ranking</span>

      <div className="flex gap-8 text-center">
        <UserRankingItem title="Rank" value={rank} />
        <UserRankingItem
          title="Group pts"
          value={groupPoints}
          className="max-sm:hidden"
        />
        <UserRankingItem
          title="Playoff pts"
          value={playoffPoints}
          className="max-sm:hidden"
        />
        <UserRankingItem title="Total pts" value={totalPoints} />
      </div>
    </div>
  );
}
