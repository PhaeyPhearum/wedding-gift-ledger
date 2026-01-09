import { memo, useState } from "react";
import { GuestRecord } from "@/types/guest";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GuestListProps {
  guests: GuestRecord[];
  onSelect: (guest: GuestRecord) => void;
  selectedId: string | null;
  searchQuery: string;
  onCreateGuest: (name: string, side: "groom" | "bride") => GuestRecord;
  showRecorded?: boolean;
}

function formatKHR(amount: number): string {
  return amount.toLocaleString("km-KH") + "៛";
}

export const GuestList = memo(function GuestList({
  guests,
  onSelect,
  selectedId,
  searchQuery,
  onCreateGuest,
  showRecorded = false,
}: GuestListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestSide, setNewGuestSide] = useState<"groom" | "bride">("groom");

  const noResults = guests.length === 0 && searchQuery.trim().length > 0;

  const handleCreateGuest = () => {
    if (!newGuestName.trim()) return;
    const newGuest = onCreateGuest(newGuestName.trim(), newGuestSide);
    setShowCreateDialog(false);
    setNewGuestName("");
    onSelect(newGuest as GuestRecord);
  };

  if (guests.length === 0 && !searchQuery.trim()) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {showRecorded ? "មិនមានភ្ញៀវកត់រួចរាល់ទេ" : "សូមស្វែងរកឈ្មោះភ្ញៀវ"}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {guests.slice(0, 10).map((guest) => {
          const hasData = guest.amountRiel !== null && guest.amountRiel > 0;
          const isSelected = selectedId === guest.id;
          const sideLabel = guest.side === "groom" ? "ប្រុស 👦🏻" : "ស្រី 🌸";
          const displayName = guest.displayName || guest.name;

          return (
            <button
              key={guest.id}
              onClick={() => onSelect(guest)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                isSelected
                  ? "bg-primary/20 border-primary"
                  : hasData
                  ? "bg-success/10 border-success/30 hover:bg-success/20"
                  : "bg-card border-border hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <span className="font-medium text-foreground block">{displayName}</span>
                    <span className="text-xs text-muted-foreground">ភ្ញៀវខាង{sideLabel}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {hasData && (
                    <>
                      <span className="text-sm text-primary font-medium">
                        {formatKHR(guest.amountRiel!)}
                      </span>
                      <Check className="h-5 w-5 text-success" />
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        
        {guests.length > 10 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            បង្ហាញតែ ១០ នាក់ដំបូង - សូមស្វែងរកឈ្មោះជាក់លាក់
          </p>
        )}

        {/* Show create new guest button when no results */}
        {noResults && (
          <div className="text-center py-6 space-y-3">
            <p className="text-muted-foreground">រកមិនឃើញភ្ញៀវ "{searchQuery}"</p>
            <Button
              variant="secondary"
              onClick={() => {
                setNewGuestName(searchQuery);
                setShowCreateDialog(true);
              }}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              ➕ បង្កើតភ្ញៀវថ្មី
            </Button>
          </div>
        )}
      </div>

      {/* Create Guest Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">
              បង្កើតភ្ញៀវថ្មី
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              បង្កើតភ្ញៀវថ្មីមែនទេ? សូមបញ្ជាក់ព័ត៌មាន។
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm mb-2 block">ឈ្មោះភ្ញៀវ</Label>
              <Input
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="ឈ្មោះពេញ"
                className="bg-input border-border"
              />
            </div>
            
            <div>
              <Label className="text-sm mb-2 block">ភ្ញៀវខាង</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="newGuestSide"
                    checked={newGuestSide === "groom"}
                    onChange={() => setNewGuestSide("groom")}
                    className="w-4 h-4 accent-primary"
                  />
                  <span>🧑🏻ភ្ញៀវខាងប្រុស</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="newGuestSide"
                    checked={newGuestSide === "bride"}
                    onChange={() => setNewGuestSide("bride")}
                    className="w-4 h-4 accent-primary"
                  />
                  <span>👩🏻ភ្ញៀវខាងស្រី</span>
                </label>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border">
              បោះបង់
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateGuest} disabled={!newGuestName.trim()}>
              បង្កើត
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});