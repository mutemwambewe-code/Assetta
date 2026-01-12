import Image from "next/image";
import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative aspect-square", className)}>
      <Image
        src="/logo.png"
        alt="App Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
};
