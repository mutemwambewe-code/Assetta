import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 84"
      className={cn("text-accent", className)}
      fill="currentColor"
      aria-label="Assetta Logo"
    >
        <path d="M28.53,0A28.53,28.53,0,0,0,0,28.53V84H16.91V34.09H39.87V22.65H16.91V28.53a11.62,11.62,0,1,1,23.24,0V84h16V28.53A28.53,28.53,0,0,0,28.53,0Z"/>
    </svg>
  );
};
