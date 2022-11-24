import type { Group, Playoff, Stadium, Stage, Team } from "@prisma/client";
import { Link } from "@remix-run/react";
import type { To } from "history";
import { SoccerIcon } from "../icons/soccer-icon";
import { MatchCardDetails } from "./match-details";
import { MatchCardTeamFlag } from "./match-team-flag";

export interface MatchCardProps {
  toMatch: To;
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
  homeTeam: {
    name?: string;
    score?: number | null;
    flag?: string | null;
  };
  awayTeam: {
    name?: string;
    score?: number | null;
    flag?: string | null;
  };
  goalScorerName?: string;
}

export function MatchCard({
  toMatch,
  match,
  homeTeam,
  awayTeam,
  goalScorerName,
}: MatchCardProps) {
  return (
    <div className="flex flex-col bg-white p-4 rounded-md gap-4">
      <MatchCardDetails match={match} />

      <div className="grid grid-cols-match-card items-center gap-4">
        <div className="flex items-center justify-end gap-2">
          <div className="text-16-medium">{homeTeam.name ?? "Team A"}</div>
          <MatchCardTeamFlag
            size="small"
            src={homeTeam?.flag}
            alt={homeTeam?.name}
          />
        </div>

        <Link
          to={toMatch}
          prefetch="intent"
          className="text-24-bold text-bright-purple text-center"
        >
          <span>{homeTeam.score ?? "?"}</span>
          <span> - </span>
          <span>{awayTeam.score ?? "?"}</span>
        </Link>

        <div className="flex items-center justify-start gap-2">
          <MatchCardTeamFlag
            size="small"
            src={awayTeam?.flag}
            alt={awayTeam?.name}
          />
          <div className="text-16-medium">{awayTeam.name ?? "Team B"}</div>
        </div>
      </div>

      <div className="flex justify-center items-center gap-2">
        <SoccerIcon width="20px" height="20px" fill="var(--dark-blue)" />

        <span className="text-16-bold">
          {goalScorerName ? goalScorerName : "TBA"}
        </span>
      </div>
    </div>
  );
}
