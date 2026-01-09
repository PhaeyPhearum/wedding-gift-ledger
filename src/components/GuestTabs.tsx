import { memo } from "react";

interface GuestTabsProps {
  activeTab: "pending" | "recorded";
  onTabChange: (tab: "pending" | "recorded") => void;
  pendingCount: number;
  recordedCount: number;
}

export const GuestTabs = memo(function GuestTabs({
  activeTab,
  onTabChange,
  pendingCount,
  recordedCount,
}: GuestTabsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onTabChange("pending")}
        className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
          activeTab === "pending"
            ? "bg-primary text-primary-foreground font-bold"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
        }`}
      >
        មិនទាន់កត់
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-background/20">
          {pendingCount}
        </span>
      </button>
      
      <button
        onClick={() => onTabChange("recorded")}
        className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
          activeTab === "recorded"
            ? "bg-success text-success-foreground font-bold"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
        }`}
      >
        កត់រួចរាល់
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-background/20">
          {recordedCount}
        </span>
      </button>
    </div>
  );
});