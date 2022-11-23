import { Form } from "@remix-run/react";
import { PeopleIcon } from "~/components/icons/people-icon";
import { PowerIcon } from "~/components/icons/power-icon";
import { SoccerIcon } from "~/components/icons/soccer-icon";
import { NavLinkItem } from "./navlink-item";

export function NavList() {
  return (
    <ul className="flex gap-12">
      <li>
        <NavLinkItem
          to="/game"
          end
          icon={
            <SoccerIcon
              width="20px"
              height="20px"
              fill="var(--bright-purple)"
            />
          }
        >
          Matches
        </NavLinkItem>
      </li>
      <li>
        <NavLinkItem
          to="/game/group-stage"
          end
          icon={
            <SoccerIcon
              width="20px"
              height="20px"
              fill="var(--bright-purple)"
            />
          }
        >
          Group Stage
        </NavLinkItem>
      </li>
      <li>
        <NavLinkItem
          to="/game/playoff-stage"
          end
          icon={
            <SoccerIcon
              width="20px"
              height="20px"
              fill="var(--bright-purple)"
            />
          }
        >
          Playoff Stage
        </NavLinkItem>
      </li>
      <li>
        <NavLinkItem to="/game/ranking" icon={<PeopleIcon />}>
          Ranking
        </NavLinkItem>
      </li>
      <li>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2 p-4 hover:text-brighter-purple"
          >
            <PowerIcon />
            Logout
          </button>
        </Form>
      </li>
    </ul>
  );
}
