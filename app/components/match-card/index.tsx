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
import { OpenIcon } from "../icons/open-icon";
import { SoccerIcon } from "../icons/soccer-icon";
import { MatchCardDetails } from "./details";
import { MatchCardTeamFlag } from "./flag";

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
    <div className="relative flex flex-col bg-white p-4 rounded-md gap-4">
      <Link to={to} prefetch="intent" className="absolute top-2 right-2">
        <OpenIcon />
      </Link>

      <MatchCardDetails match={match} />

      <div className="grid grid-cols-match-card items-center gap-4">
        <div className="flex items-center justify-end gap-2">
          <div className="text-16-medium">
            {match.homeTeam?.name ?? "Team A"}
          </div>
          <MatchCardTeamFlag
            type="small"
            src={match.homeTeam?.flag}
            alt={match.homeTeam?.name}
          />
        </div>

        <div className={`text-24-bold text-center ${scoreTextColor}`}>
          <span>{homeTeamScore ?? "?"}</span>
          <span> - </span>
          <span>{awayTeamScore ?? "?"}</span>
        </div>

        <div className="flex items-center justify-start gap-2">
          <MatchCardTeamFlag
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
        <SoccerIcon width="20px" height="20px" fill="var(--dark-blue)" />

        <span className={`text-16-bold ${goalScorerTextColor}`}>
          {goalScorer?.name ? goalScorer.name : "No Goal Scorer"}
        </span>
      </div>
    </div>
  );
}
