import { Popover } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  FlagIcon,
  HomeIcon,
  TrophyIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Form } from "@remix-run/react";
import { usePopupHandler } from "~/hooks/usePopupHandler";
import { NavLinkItem } from "./NavigationLink";

type NavType = "desktop" | "mobile";
export interface NavListProps {
  type: NavType;
  username?: string;
}

export function NavList({ type, username = "-" }: NavListProps) {
  const { toggle } = usePopupHandler();

  return (
    <nav className={`${type === "desktop" ? "max-lg:hidden" : ""}`}>
      <ul
        className={`flex ${
          type === "desktop" ? "gap-12 max-xl:gap-4" : "flex-col"
        }`}
      >
        <li>
          <NavLinkItem
            to="/game"
            prefetch="intent"
            end
            className="flex items-center gap-2 p-4"
            icon={<HomeIcon className="w-5 text-bright-purple" />}
          >
            Matches
          </NavLinkItem>
        </li>
        <li>
          <NavLinkItem
            to="/game/group-stage"
            prefetch="intent"
            end
            className="flex items-center gap-2 p-4"
            icon={<FlagIcon className="w-5 text-bright-purple" />}
          >
            Group Stage
          </NavLinkItem>
        </li>
        <li>
          <NavLinkItem
            to="/game/playoff-stage"
            prefetch="intent"
            end
            className="flex items-center gap-2 p-4"
            icon={<FlagIcon className="w-5 text-bright-purple" />}
          >
            Playoff Stage
          </NavLinkItem>
        </li>
        <li>
          <NavLinkItem
            to="/game/ranking"
            prefetch="intent"
            className="flex items-center gap-2 p-4"
            icon={<TrophyIcon className="w-5 text-bright-purple" />}
          >
            Ranking
          </NavLinkItem>
        </li>

        <li>
          {type === "mobile" ? (
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 p-4 hover:text-brighter-purple"
              >
                <ArrowLeftOnRectangleIcon className="w-5 text-bright-purple" />
                Logout
              </button>
            </Form>
          ) : null}

          {type === "desktop" ? (
            <Popover className="relative -mr-4">
              <Popover.Button
                onClick={toggle}
                className="flex items-center gap-2 p-4 w-full justify-center hover:text-brighter-purple"
              >
                <UserIcon className="w-5 text-bright-purple" />
                Account
              </Popover.Button>

              <Popover.Panel className="absolute top-full right-0 z-10 w-56 py-1 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="w-full px-4 py-2">
                  <div className="text-12-regular text-dark-blue">
                    Account Name
                  </div>
                  <div className="text-dark-blue whitespace-nowrap text-ellipsis overflow-hidden">
                    {username}
                  </div>
                </div>

                <hr />

                <Form action="/logout" method="post">
                  <button
                    type="submit"
                    className="px-4 py-2 w-full text-left text-bright-purple hover:text-brighter-purple"
                  >
                    Logout
                  </button>
                </Form>
              </Popover.Panel>
            </Popover>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
