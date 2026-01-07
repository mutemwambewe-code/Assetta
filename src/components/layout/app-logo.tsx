import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 216 216"
      className={cn("text-foreground", className)}
      fill="currentColor"
    >
      <path
        d="M94.8 160H65.2L48 184V72L94.8 160z"
        className="text-accent"
        fill="currentColor"
      />
      <path
        d="M112 120l48-80h56L131.2 160H112z"
        className="text-primary"
        fill="currentColor"
      />
      <path
        d="M160 120l48 80H120l-8-13.3L160 120z"
        className="text-primary"
        fill="currentColor"
      />
    </svg>
  );
};
