import type { Group, Playoff, Stadium, Stage, Team } from "@prisma/client";
import { Link } from "@remix-run/react";
import { getStageName } from "~/utils/match-card";

export interface MatchCardDetailsProps {
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

export function MatchCardDetails({ match }: MatchCardDetailsProps) {
  const { stage, group, playoff, startDate, stadium } = match;
  const groupName = group?.name;
  const playoffName = playoff?.name;

  const stageName = getStageName({ groupName, playoffName });

  const datePlusOneHour = new Date(startDate).setHours(
    new Date(startDate).getHours() + 1
  );
  const startDateIntl = new Intl.DateTimeFormat("en-EN", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Europe/Warsaw",
  }).format(datePlusOneHour);

  return (
    <div className="text-center">
      <div className="text-14-regular">{startDateIntl}</div>
      <div className="text-14-regular">{stadium.name}</div>
      <Link
        to={`/game/${stage.id}-stage/${group?.id ?? playoff?.id}`}
        className="text-14-regular text-bright-purple"
      >
        {stageName}
      </Link>
    </div>
  );
}
