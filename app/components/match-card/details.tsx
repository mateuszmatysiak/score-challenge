import type { Group, Playoff, Stadium, Stage, Team } from "@prisma/client";
import { Link } from "@remix-run/react";

type GetStageNameProps = {
  groupName?: string;
  playoffName?: string;
};

export const getStageName = ({ groupName, playoffName }: GetStageNameProps) => {
  if (groupName) return `Group ${groupName}`;

  if (playoffName) return playoffName;

  return "Stage Name";
};

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
  const toStageMatch = `/game/${stage.id}-stage/${group?.id ?? playoff?.id}`;

  const matchStartDate = new Date(startDate);
  const startDateIntl = new Intl.DateTimeFormat("en-EN", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Europe/Warsaw",
  }).format(matchStartDate);

  return (
    <div className="text-center">
      <div className="text-14-regular">{startDateIntl}</div>
      <div className="text-14-regular">{stadium.name}</div>
      <Link
        to={toStageMatch}
        prefetch="intent"
        className="text-14-medium text-bright-purple"
      >
        {stageName}
      </Link>
    </div>
  );
}
