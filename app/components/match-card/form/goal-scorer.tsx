import type { Team } from "@prisma/client";
import { PersonIcon } from "../../icons/person-icon";

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
        <PersonIcon fill={isChecked ? "var(--bright-purple)" : null} />
        <div className={`${isChecked ? "text-bright-purple" : ""}`}>{name}</div>
      </div>

      <input
        id={`goalScorerId[${id}]`}
        type="radio"
        name="goalScorerId"
        defaultValue={id}
        defaultChecked={isChecked}
        className="cursor-pointer"
      />
    </label>
  );
}
