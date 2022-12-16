import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLocation } from "@remix-run/react";
import { useEffect } from "react";
import { usePopupHandler } from "~/hooks/usePopupHandler";
import { IconButton } from "./IconButton";
import { NavList } from "./NavigationList";

export interface MobileMenuProps {
  username?: string;
}

export function MobileMenu({ username = "-" }: MobileMenuProps) {
  const location = useLocation();
  const { isOpen, open, close } = usePopupHandler();

  useEffect(() => {
    close();
  }, [close, location.key]);

  return (
    <>
      <IconButton
        ariaLabel="Open mobile menu"
        className="hidden max-lg:block p-3 -mr-3"
        onClick={open}
      >
        <Bars3Icon className="w-6" title="Menu icon" />
      </IconButton>

      {isOpen ? (
        <div className="fixed inset-0">
          <div className="w-full h-full bg-maroon overflow-auto">
            <div className="flex justify-between items-center h-16 px-8 max-sm:px-4">
              <div className="flex flex-col">
                <span className="text-12-regular">Account Name</span>
                <span className="whitespace-nowrap text-ellipsis overflow-hidden">
                  {username}
                </span>
              </div>

              <IconButton
                ariaLabel="Close mobile menuu"
                className="p-4 -mr-4"
                onClick={close}
              >
                <XMarkIcon className="w-6" title="Close icon" />
              </IconButton>
            </div>

            <NavList type="mobile" username={username} />
          </div>
        </div>
      ) : null}
    </>
  );
}
