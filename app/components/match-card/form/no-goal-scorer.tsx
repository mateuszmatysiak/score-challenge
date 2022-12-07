import { PersonIcon } from "../../icons/person-icon";

export interface NoGoalScorerProps {
  goalScorerId: number | null;
}

export function NoGoalScorer({ goalScorerId }: NoGoalScorerProps) {
  return (
    <label
      htmlFor={`goalScorerId[0]`}
      className="flex justify-between cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <PersonIcon size="20px" fill="var(--dark-blue)" />
        <div>No goal scorer</div>
      </div>

      <input
        id={`goalScorerId[0]`}
        type="radio"
        name="goalScorerId"
        defaultValue={0}
        defaultChecked={goalScorerId === null}
        aria-label="No goal scorer"
        className="cursor-pointer"
      />
    </label>
  );
}
