import { Link } from "@remix-run/react";

export default function GameMenuRoute() {
  return (
    <div className="flex gap-4">
      <Link
        to="/game/group-stage"
        className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
      >
        Group stage
      </Link>
      <Link
        to="/game/knockout-stage"
        className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
      >
        Knockout stage
      </Link>
      <Link
        to="/game/ranking"
        className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
      >
        Ranking
      </Link>
    </div>
  );
}
