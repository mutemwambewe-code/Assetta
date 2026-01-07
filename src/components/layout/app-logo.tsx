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
        <path d="M113.3,24.5l-88,192h42.4l19.9-44h96.8l19.9,44h42.4l-88-192H113.3z M128,68.5l34.4,76h-68.8L128,68.5z"/>
    </svg>
  );
};
