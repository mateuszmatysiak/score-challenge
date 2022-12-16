import { UserIcon } from "@heroicons/react/24/outline";

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
        <UserIcon className="w-5 text-dark-blue" />
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
