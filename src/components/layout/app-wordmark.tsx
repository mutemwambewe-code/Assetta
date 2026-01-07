
import { cn } from "@/lib/utils";

export const AppWordmark = ({ className }: { className?: string }) => {
  return (
    <svg 
        viewBox="0 0 250 60"
        className={cn("text-foreground", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Assetta"
    >
      {/* The letter "A" in orange */}
      <text 
        x="0" 
        y="45" 
        fontFamily="'PT Sans', sans-serif" 
        fontSize="50" 
        fontWeight="bold" 
        fill="hsl(var(--accent))"
        letterSpacing="1"
      >
        A
      </text>
      
      {/* The rest of the letters "SSETTA" in blue */}
      <text 
        x="35" 
        y="45" 
        fontFamily="'PT Sans', sans-serif" 
        fontSize="50" 
        fontWeight="bold" 
        fill="hsl(var(--primary))"
        letterSpacing="1"
      >
        SSETTA
      </text>
    </svg>
  );
};
