import { Dialog } from "@headlessui/react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePopupHandler } from "~/hooks/usePopupHandler";
import { IconButton } from "./IconButton";

const RULES = [
  { label: "Predicting the result", value: 3 },
  { label: "Predicting the winner", value: 1 },
  { label: "Predicting the goal scorer", value: 1 },
];

export function GameRules() {
  const { isOpen, open, close } = usePopupHandler();

  return (
    <>
      <IconButton
        ariaLabel="Game rules"
        className="fixed bottom-4 right-4 p-3 bg-purple rounded-full shadow-lg z-10"
        onClick={open}
      >
        <InformationCircleIcon
          className="w-6 text-white"
          title="Information icon"
        />
      </IconButton>

      {isOpen ? (
        <Dialog open={isOpen} onClose={close} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 z-10 overflow-y-auto flex justify-center items-center">
            <Dialog.Panel className="w-full max-w-xl m-2 bg-white shadow-xl rounded-md">
              <Dialog.Title className="relative flex justify-center items-center h-32 bg-purple text-30-medium text-white rounded-t-md">
                How to score points
                <IconButton
                  ariaLabel="Close game rules dialog"
                  className="absolute top-0 right-0 p-3"
                  onClick={close}
                >
                  <XMarkIcon className="w-6" title="Close icon" />
                </IconButton>
              </Dialog.Title>

              <ul className="p-8">
                {RULES.map((rule, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{rule.label}</span>
                    <span>{rule.value} pts</span>
                  </li>
                ))}
              </ul>
            </Dialog.Panel>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
