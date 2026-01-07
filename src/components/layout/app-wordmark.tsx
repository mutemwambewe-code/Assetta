import { cn } from "@/lib/utils";

export const AppWordmark = ({ className }: { className?: string }) => {
  return (
    <svg 
        viewBox="0 0 400 60"
        className={cn("text-foreground", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Assetta"
    >
      <text 
        x="0" 
        y="45" 
        fontFamily="'PT Sans', sans-serif" 
        fontSize="50" 
        fontWeight="bold" 
        fill="hsl(var(--accent))"
      >
        A
      </text>
      <text 
        x="38" 
        y="45" 
        fontFamily="'PT Sans', sans-serif" 
        fontSize="50" 
        fontWeight="bold" 
        fill="hsl(var(--primary))"
      >
        SSETTA
      </text>
    </svg>
  );
};
