import NextImage from "next/image";
import { cn } from "@/lib/utils";

export const AppWordmark = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative flex items-center justify-start h-20 w-96", className)}>
      <NextImage
        src="/brand-logo-transparent.png"
        alt="Assetta"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  );
};
