import type { UserRanking } from "@prisma/client";

export interface UserRankingItemProps {
  userRanking?:
    | (UserRanking & {
        rank: number;
      })
    | null;
}

export function UserRankingItem({ userRanking }: UserRankingItemProps) {
  return (
    <div className="flex gap-8">
      <div className="flex flex-col items-center">
        <span className="text-16-bold text-bright-purple">
          {userRanking?.rank}
        </span>
        <span className="text-14-medium">Rank</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-16-bold text-bright-purple">
          {userRanking?.groupPoints ?? "-"}
        </span>
        <span className="text-14-medium">Group Pts</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-16-bold text-bright-purple">
          {userRanking?.playoffPoints ?? "-"}
        </span>
        <span className="text-14-medium">Playoff Pts</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-16-bold text-bright-purple">
          {userRanking?.totalPoints ?? "-"}
        </span>
        <span className="text-14-medium">Total Pts</span>
      </div>
    </div>
  );
}
