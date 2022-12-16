import { UserIcon } from "@heroicons/react/24/outline";
import type { Team } from "@prisma/client";

export interface GoalScorerProps {
  id: number;
  name: string;
  team: Team;
  teamId: string;
  userMatches?: {
    goalScorerId: number | null;
  }[];
  tournamentMatches?: {
    goalScorerId: number | null;
  }[];
}

export function GoalScorer({
  id,
  name,
  userMatches,
  tournamentMatches,
}: GoalScorerProps) {
  const goalScorerId = (userMatches?.[0] || tournamentMatches?.[0])
    ?.goalScorerId;
  const isChecked = id === goalScorerId;
  return (
    <label
      htmlFor={`goalScorerId[${id}]`}
      className="flex justify-between cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <UserIcon
          className={`w-5 ${isChecked ? "var(--bright-purple)" : ""}`}
        />
        <div className={`${isChecked ? "text-bright-purple" : ""}`}>{name}</div>
      </div>

      <input
        id={`goalScorerId[${id}]`}
        type="radio"
        name="goalScorerId"
        defaultValue={id}
        defaultChecked={isChecked}
        className="cursor-pointer"
        aria-label={`Goal scorer: ${name}`}
      />
    </label>
  );
}
