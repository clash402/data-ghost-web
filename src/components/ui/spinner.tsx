import { ImSpinner2 } from "react-icons/im";

import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
};

export function Spinner({ className }: SpinnerProps) {
  return (
    <ImSpinner2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />
  );
}
