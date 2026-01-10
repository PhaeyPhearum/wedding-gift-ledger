import { memo } from "react";
import { Wifi, WifiOff, Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import { SyncState } from "@/types/sync";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
  syncState: SyncState;
  isOnline: boolean;
}

export const SyncStatus = memo(function SyncStatus({
  syncState,
  isOnline,
}: SyncStatusProps) {
  // Determine status message and styling
  const getStatus = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: "រក្សាទុកក្នុងម៉ាស៊ីន",
        subtext: "អ៊ីនធឺណិតយឺត",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
      };
    }

    if (syncState.errorCount > 0) {
      return {
        icon: CloudOff,
        text: "មិនទាន់ផ្ញើទៅម៉ាស៊ីនមេ",
        subtext: `${syncState.errorCount} កំហុស`,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
      };
    }

    if (syncState.isSyncing) {
      return {
        icon: Loader2,
        text: "កំពុងផ្ញើទិន្នន័យ...",
        subtext: null,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        animate: true,
      };
    }

    if (syncState.pendingCount > 0) {
      return {
        icon: Cloud,
        text: "រក្សាទុកក្នុងម៉ាស៊ីន",
        subtext: `${syncState.pendingCount} រង់ចាំផ្ញើ`,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
      };
    }

    return {
      icon: Check,
      text: "ទិន្នន័យបានរក្សាទុករួច",
      subtext: null,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs",
        status.bgColor,
        status.borderColor
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          status.color,
          (status as any).animate && "animate-spin"
        )}
      />
      <div className="flex flex-col">
        <span className={cn("font-medium", status.color)}>{status.text}</span>
        {status.subtext && (
          <span className="text-[10px] text-muted-foreground">
            {status.subtext}
          </span>
        )}
      </div>
      
      {/* Online indicator */}
      <div className="ml-1">
        {isOnline ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-yellow-500" />
        )}
      </div>
    </div>
  );
});
