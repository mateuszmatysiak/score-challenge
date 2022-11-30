import { PrismaClient } from "@prisma/client";
import {
  groupMatches,
  groups,
  players,
  playoffMatches,
  playoffs,
  stadiums,
  stages,
  teams,
} from "./data";
import { seedTournamentMatches } from "./utils";

const db = new PrismaClient();

async function seed() {
  /* Utworzenie stadionów */
  await db.stadium.createMany({ data: stadiums });
  /* Utworzenie etapów */
  await db.stage.createMany({ data: stages });
  /* Utworzenie grup */
  await db.group.createMany({ data: groups });
  /* Utworzenie playoffów */
  await db.playoff.createMany({ data: playoffs });
  /* Utworzenie drużyn */
  await db.team.createMany({ data: teams });
  /* Utworzenie piłkarzy */
  await db.player.createMany({ data: players });
  /* Utworzenie meczów grupowych i playoff */
  await db.match.createMany({
    data: [...groupMatches, ...playoffMatches],
  });

  /* Pobranie meczów */
  const matches = await db.match.findMany();

  /* Utworzenie spotkań dla turnieju */
  const tournamentMatches = await Promise.all(
    seedTournamentMatches({ matches })
  );
  await db.tournamentMatch.createMany({ data: tournamentMatches });
}

seed();
