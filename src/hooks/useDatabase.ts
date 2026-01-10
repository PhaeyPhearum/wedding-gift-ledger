import { useState, useEffect, useCallback, useMemo } from "react";
import {
  initDB,
  getAllGuests,
  saveGuestRecord,
  createCustomGuest,
  getPendingSyncCount,
  exportBackup,
  importBackup,
  migrateFromLocalStorage,
} from "@/lib/db";
import { GuestRecordDB, SyncState, BackupData } from "@/types/sync";
import { GuestRecord, BankInfo, USD_TO_KHR_RATE } from "@/types/guest";

// Convert DB record to UI record
function toGuestRecord(db: GuestRecordDB): GuestRecord {
  return {
    id: db.id,
    name: db.name,
    side: db.side,
    displayName: db.displayName,
    amountRiel: db.amountRiel,
    paymentType: db.paymentType,
    bank: db.bankType && db.bankRef ? { type: db.bankType, ref: db.bankRef } : null,
    note: db.note,
    updatedAt: db.updatedAt ? new Date(db.updatedAt).toISOString() : null,
  };
}

export function useDatabase() {
  const [guests, setGuests] = useState<GuestRecordDB[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    errorCount: 0,
  });

  // Initialize database and load data
  useEffect(() => {
    async function init() {
      try {
        await initDB();
        
        // Migrate from localStorage if exists
        await migrateFromLocalStorage();
        
        // Load all guests
        const allGuests = await getAllGuests();
        setGuests(allGuests);
        
        // Update pending count
        const pending = await getPendingSyncCount();
        setSyncState((s) => ({ ...s, pendingCount: pending }));
        
        setIsLoaded(true);
        console.log("[DB] Loaded", allGuests.length, "guests");
      } catch (e) {
        console.error("[DB] Init error:", e);
        setIsLoaded(true); // Still show UI, but may be empty
      }
    }
    init();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState((s) => ({ ...s, isOnline: true }));
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState((s) => ({ ...s, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh guests from DB
  const refreshGuests = useCallback(async () => {
    const allGuests = await getAllGuests();
    setGuests(allGuests);
    const pending = await getPendingSyncCount();
    setSyncState((s) => ({ ...s, pendingCount: pending }));
  }, []);

  // Convert to UI format
  const guestRecords = useMemo((): GuestRecord[] => {
    return guests.map(toGuestRecord);
  }, [guests]);

  // Split guests
  const pendingGuests = useMemo(() => {
    return guestRecords.filter((g) => g.amountRiel === null || g.amountRiel === 0);
  }, [guestRecords]);

  const recordedGuests = useMemo(() => {
    return guestRecords.filter((g) => g.amountRiel !== null && g.amountRiel > 0);
  }, [guestRecords]);

  // Save guest (IndexedDB-first, NEVER blocks)
  const saveGuest = useCallback(
    async (
      guestId: string,
      amountRiel: number | null,
      paymentType: "cash" | "bank",
      bank: BankInfo | null,
      note: string,
      displayName?: string
    ): Promise<boolean> => {
      try {
        await saveGuestRecord(guestId, {
          amountRiel,
          paymentType,
          bankType: bank?.type || null,
          bankRef: bank?.ref || null,
          note,
          displayName,
        });
        
        // Refresh local state
        await refreshGuests();
        
        return true;
      } catch (e) {
        console.error("[DB] Save error:", e);
        return false;
      }
    },
    [refreshGuests]
  );

  // Create new guest
  const createGuest = useCallback(
    async (name: string, side: "groom" | "bride"): Promise<GuestRecord | null> => {
      try {
        const newGuest = await createCustomGuest(name, side);
        await refreshGuests();
        return toGuestRecord(newGuest);
      } catch (e) {
        console.error("[DB] Create error:", e);
        return null;
      }
    },
    [refreshGuests]
  );

  // Check if guest has existing data
  const hasExistingData = useCallback(
    (guestId: string): boolean => {
      const guest = guests.find((g) => g.id === guestId);
      return !!(guest && guest.amountRiel !== null && guest.amountRiel > 0);
    },
    [guests]
  );

  // Calculate totals
  const totals = useMemo(() => {
    let totalCash = 0;
    let totalBank = 0;
    let cashCount = 0;
    let bankCount = 0;

    guests.forEach((guest) => {
      if (guest.amountRiel !== null && guest.amountRiel > 0) {
        if (guest.paymentType === "cash") {
          totalCash += guest.amountRiel;
          cashCount++;
        } else {
          totalBank += guest.amountRiel;
          bankCount++;
        }
      }
    });

    const contributorCount = cashCount + bankCount;
    const cashPercent = contributorCount > 0 ? Math.round((cashCount / contributorCount) * 100) : 0;
    const bankPercent = contributorCount > 0 ? Math.round((bankCount / contributorCount) * 100) : 0;

    return {
      totalCash,
      totalBank,
      grandTotal: totalCash + totalBank,
      contributorCount,
      cashCount,
      bankCount,
      cashPercent,
      bankPercent,
    };
  }, [guests]);

  // Export to CSV
  const exportCSV = useCallback(() => {
    const headers = [
      "ឈ្មោះ",
      "ឈ្មោះបង្ហាញ",
      "ភ្ញៀវខាង",
      "ចំនួនប្រាក់ (៛)",
      "ប្រភេទទូទាត់",
      "ធនាគារ",
      "លេខប្រតិបត្តិការ",
      "កំណត់ចំណាំ",
      "ពេលវេលា",
    ];
    
    const rows = guestRecords
      .filter((g) => g.amountRiel !== null && g.amountRiel > 0)
      .map((g) => [
        g.name,
        g.displayName,
        g.side === "groom" ? "ប្រុស" : "ស្រី",
        g.amountRiel?.toString() ?? "0",
        g.paymentType === "cash" ? "សាច់ប្រាក់" : "បញ្ជូនប្រាក់",
        g.bank?.type ?? "",
        g.bank?.ref ?? "",
        g.note ?? "",
        g.updatedAt ?? "",
      ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding_money_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [guestRecords]);

  // Export JSON backup
  const exportJSON = useCallback(async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import JSON backup
  const importJSON = useCallback(
    async (file: File): Promise<{ success: boolean; message: string }> => {
      try {
        const text = await file.text();
        const data: BackupData = JSON.parse(text);

        if (!data.version || !data.guests) {
          return { success: false, message: "Invalid backup file format" };
        }

        const result = await importBackup(data);
        await refreshGuests();

        return {
          success: true,
          message: `Imported ${result.imported} records, skipped ${result.skipped}, errors ${result.errors}`,
        };
      } catch (e) {
        console.error("[DB] Import error:", e);
        return { success: false, message: "Failed to import backup file" };
      }
    },
    [refreshGuests]
  );

  return {
    // Data
    guests: guestRecords,
    pendingGuests,
    recordedGuests,
    
    // Actions
    saveGuest,
    createGuest,
    hasExistingData,
    
    // Totals
    totals,
    
    // Export/Import
    exportCSV,
    exportJSON,
    importJSON,
    
    // State
    isLoaded,
    syncState,
    isOnline,
    
    // Refresh
    refreshGuests,
  };
}
