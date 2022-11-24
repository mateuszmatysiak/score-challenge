import type {
  Group,
  Player,
  Playoff,
  Stadium,
  Stage,
  Team,
} from "@prisma/client";
import { Link } from "@remix-run/react";
import { SoccerIcon } from "../icons/soccer-icon";
import { MatchCardDetails } from "./match-details";
import { MatchCardTeamFlag } from "./match-team-flag";

export interface MatchCardProps {
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
  };
}

export function MatchCard({
  match,
  goalScorer,
  homeTeamScore,
  awayTeamScore,
}: MatchCardProps) {
  const stageId = match.group?.id ?? match.playoff?.id;
  const stageTypeId = match.stage.id;

  const toMatch = `/game/${stageTypeId}-stage/${stageId}/match-${match.id}`;

  return (
    <div className="flex flex-col bg-white p-4 rounded-md gap-4">
      <MatchCardDetails match={match} />

      <div className="grid grid-cols-match-card items-center gap-4">
        <div className="flex items-center justify-end gap-2">
          <div className="text-16-medium">
            {match.homeTeam?.name ?? "Team A"}
          </div>
          <MatchCardTeamFlag
            size="small"
            src={match.homeTeam?.flag}
            alt={match.homeTeam?.name}
          />
        </div>

        <Link
          to={toMatch}
          prefetch="intent"
          className="text-24-bold text-bright-purple text-center"
        >
          <span>{homeTeamScore ?? "?"}</span>
          <span> - </span>
          <span>{awayTeamScore ?? "?"}</span>
        </Link>

        <div className="flex items-center justify-start gap-2">
          <MatchCardTeamFlag
            size="small"
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

        <span className="text-16-bold">
          {goalScorer?.name ? goalScorer.name : "TBA"}
        </span>
      </div>
    </div>
  );
}
