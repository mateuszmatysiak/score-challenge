import type { NavLinkProps } from "@remix-run/react";
import { NavLink } from "@remix-run/react";

export interface NavLinkItemProps extends NavLinkProps {
  icon?: React.ReactNode;
}

export function NavLinkItem({
  to,
  end,
  children,
  icon,
  className,
  ...otherProps
}: NavLinkItemProps) {
  const isActiveClassName = "text-brighter-purple";

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `hover:text-brighter-purple ${className} ${
          isActive ? isActiveClassName : ""
        }`
      }
      {...otherProps}
    >
      {({ isActive }) => (
        <>
          {icon}

          {typeof children === "function" ? children?.({ isActive }) : children}
        </>
      )}
    </NavLink>
  );
}
