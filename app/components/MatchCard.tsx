import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type {
  Group,
  Player,
  Playoff,
  Stadium,
  Stage,
  Team,
  TournamentMatch,
} from "@prisma/client";
import { Link } from "@remix-run/react";
import { MatchDetails } from "./MatchDetails";
import { TeamFlag } from "./TeamFlag";
import { UserIcon } from "@heroicons/react/24/outline";

type GetGoalScorerTextColorProps = {
  goalScorer: Player | null;
  tournamentMatch?: TournamentMatch;
};

const getGoalScorerTextColor = ({
  goalScorer,
  tournamentMatch,
}: GetGoalScorerTextColorProps) => {
  const tournamentGoalScorerId = tournamentMatch?.goalScorerId;
  const isTournamentScoreExists =
    typeof tournamentMatch?.homeTeamScore === "number";

  if (goalScorer?.id && isTournamentScoreExists) {
    if (goalScorer.id !== tournamentGoalScorerId) return "text-red-600";

    if (goalScorer.id === tournamentGoalScorerId) return "text-green-600";
  }

  return "text-dark-blue";
};

type GetResultTextColor = {
  userScores: {
    homeTeamScore: number | null;
    awayTeamScore: number | null;
  };
  tournamentScores: {
    homeTeamScore?: number | null;
    awayTeamScore?: number | null;
  };
};

const getResultTextColor = ({
  userScores,
  tournamentScores,
}: GetResultTextColor) => {
  if (
    typeof userScores.homeTeamScore !== "number" ||
    typeof tournamentScores.homeTeamScore !== "number"
  )
    return "text-dark-blue";

  if (
    userScores.homeTeamScore === tournamentScores.homeTeamScore &&
    userScores.awayTeamScore === tournamentScores.awayTeamScore
  )
    return "text-green-600";

  return "text-red-600";
};

export interface MatchCardProps {
  toMatch?: string;
  values: {
    homeTeamScore: number | null;
    awayTeamScore: number | null;
    goalScorer: Player | null;
    match: {
      id: number;
      homeTeam: Team | null;
      awayTeam: Team | null;
      group: Group | null;
      playoff: Playoff | null;
      stage: Stage;
      startDate: string;
      stadium: Stadium;
      tournamentMatches?: TournamentMatch[];
    };
  };
}

export function MatchCard({ values, toMatch }: MatchCardProps) {
  const { match, goalScorer, homeTeamScore, awayTeamScore } = values;
  const stageId = match.group?.id ?? match.playoff?.id;
  const stageTypeId = match.stage.id;

  const goalScorerTextColor = getGoalScorerTextColor({
    goalScorer,
    tournamentMatch: match.tournamentMatches?.[0],
  });

  const scoreTextColor = getResultTextColor({
    userScores: { homeTeamScore, awayTeamScore },
    tournamentScores: {
      homeTeamScore: match.tournamentMatches?.[0]?.homeTeamScore,
      awayTeamScore: match.tournamentMatches?.[0]?.awayTeamScore,
    },
  });

  const to =
    toMatch ?? `/game/${stageTypeId}-stage/${stageId}/match-${match.id}`;

  return (
    <div className="relative basis-[31.25rem] flex-1 flex flex-col bg-white p-4 rounded-md gap-4">
      <Link to={to} prefetch="intent" className="absolute top-2 right-2">
        <span className="sr-only">Open match betting</span>
        <ArrowTopRightOnSquareIcon className="w-5 text-bright-purple" />
      </Link>

      <MatchDetails match={match} />

      <div className="grid grid-cols-match-card items-center gap-4 max-sm:gap-0">
        <div className="flex items-center justify-end gap-2 max-sm:gap-1">
          <div className="text-16-medium text-right">
            {match.homeTeam?.name ?? "Team A"}
          </div>
          <TeamFlag
            type="small"
            src={match.homeTeam?.flag}
            alt={match.homeTeam?.name}
          />
        </div>

        <div
          className={`text-24-bold max-sm:text-16-bold text-center ${scoreTextColor}`}
        >
          <span>{homeTeamScore ?? "?"}</span>
          <span> - </span>
          <span>{awayTeamScore ?? "?"}</span>
        </div>

        <div className="flex items-center justify-start gap-2 max-sm:gap-1">
          <TeamFlag
            type="small"
            src={match.awayTeam?.flag}
            alt={match.awayTeam?.name}
          />
          <div className="text-16-medium">
            {match.awayTeam?.name ?? "Team B"}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center gap-2">
        <UserIcon className="w-5 text-dark-blue" />

        <span className={`text-16-bold ${goalScorerTextColor}`}>
          {goalScorer?.name ? goalScorer.name : "No Goal Scorer"}
        </span>
      </div>
    </div>
  );
}
