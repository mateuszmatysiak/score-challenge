import type { Prisma, Team } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { requireAdminUser } from "~/utils/session.server";

type HiddenActionField = {
  playoffId: string;
  matchId: number;
};

type PlayoffsWithMatches = Prisma.PlayoffGetPayload<{
  select: {
    id: true;
    name: true;
    matches: {
      select: {
        id: true;
        homeTeam: true;
        awayTeam: true;
        stadium: true;
        startDate: true;
      };
    };
  };
}>;

interface LoaderData {
  playoffs: PlayoffsWithMatches[];
  teams: Team[];
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdminUser(request);

  /* Pobieranie par playoff */

  const playoffs = await db.playoff.findMany({
    select: {
      id: true,
      name: true,
      matches: {
        where: { playoffId: { not: null } },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          homeTeam: true,
          awayTeam: true,
          stadium: true,
          startDate: true,
        },
      },
    },
  });

  /* Pobieranie drużyn */

  const teams = await db.team.findMany({ orderBy: { name: "asc" } });

  return json({ playoffs, teams });
};

export const action: ActionFunction = async ({ request }) => {
  await requireAdminUser(request);

  const form = await request.formData();

  /* hidden */
  const hidden = form.getAll("hidden") as string[];
  const hiddenFields = hidden.map((match) =>
    JSON.parse(match)
  ) as HiddenActionField[];

  const homeTeamsId = form.getAll("homeTeamsId") as string[];
  const awayTeamsId = form.getAll("awayTeamsId") as string[];

  const teamsId: { homeTeamId: string; awayTeamId: string }[] = [];

  for (let i = 0; i < homeTeamsId.length; i++) {
    const homeTeamId = homeTeamsId[i];
    const awayTeamId = awayTeamsId[i];
    teamsId.push({ homeTeamId, awayTeamId });
  }

  const matches = hiddenFields.map((match, index) => {
    return {
      ...match,
      homeTeamId: teamsId[index].homeTeamId || null,
      awayTeamId: teamsId[index].awayTeamId || null,
    };
  });

  /* Aktualizacja drużyn w playoff */

  for (const match of matches) {
    await db.match.update({
      where: { id: match.matchId },
      data: { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
    });
  }

  return redirect(`/game`);
};

export default function AdminPlayoffPairsRoute() {
  const { playoffs, teams } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Playoff Pairs</h1>
      </div>

      <Form method="post" className="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {playoffs.map((playoff) => (
            <li key={playoff.id} className="flex flex-col gap-4">
              {playoff.matches.map((match, index) => (
                <div key={match.id} className="p-4 bg-white rounded-md">
                  <span>
                    {index + 1}. {playoff.name},{" "}
                    {playoff.matches[index]?.stadium.name},{" "}
                    {new Date(
                      playoff.matches[index]?.startDate
                    ).toLocaleString()}
                  </span>

                  {/* Hidden field */}
                  <input
                    hidden
                    name="hidden"
                    defaultValue={JSON.stringify({
                      playoffId: playoff.id,
                      matchId: match.id,
                    })}
                  />
                  {/* Hidden field */}

                  <div>
                    <span>
                      <label htmlFor="homeTeam">Team A</label>

                      <select
                        name="homeTeamsId"
                        id="homeTeam"
                        className="border border-black"
                        defaultValue={match.homeTeam?.id}
                      >
                        <option value="">--Choose team--</option>
                        {teams.map((team) => (
                          <option
                            key={team.id}
                            value={team.id}
                            data-value={team}
                          >
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </span>
                    -
                    <span>
                      <label htmlFor="awayTeam">Team B</label>

                      <select
                        name="awayTeamsId"
                        id="awayTeam"
                        className="border border-black"
                        defaultValue={match.awayTeam?.id}
                      >
                        <option value="">--Choose team--</option>
                        {teams.map((team) => (
                          <option
                            key={team.id}
                            value={team.id}
                            data-value={team}
                          >
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
          >
            Save
          </button>
        </div>
      </Form>
    </div>
  );
}
