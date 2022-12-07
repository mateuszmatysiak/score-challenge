import { Link } from "@remix-run/react";
import { LogoIcon } from "./icons/LogoIcon";

export function LogoLink() {
  return (
    <Link to="/game" prefetch="intent" className="min-w-[3rem] min-h-[3rem]">
      <LogoIcon />
      <span className="sr-only">Home Navigation</span>
    </Link>
  );
}
