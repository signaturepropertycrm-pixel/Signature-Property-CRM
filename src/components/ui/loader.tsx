
import { cn } from "@/lib/utils";

export function AppLoader({ className }: { className?: string }) {
  return (
    <div className={cn("app-loader", className)}>
      <div className="loader-dot"></div>
      <div className="loader-dot"></div>
      <div className="loader-dot"></div>
    </div>
  );
}
