import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("text-accent", className)}
      fill="currentColor"
      aria-label="Assetta Logo"
    >
      <path d="M154.2,216,128,172.4,101.8,216l-47-73.4,22.2-34.6h46L100.8,154.4,128,110l52.2,81.4Z M202.2,24l-88.4,138-44.2-69-67.4,105.2h46L128,126l82.2,127.8h43.6Z" />
    </svg>
  );
};
