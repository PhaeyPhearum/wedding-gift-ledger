import { useState, useEffect, useCallback, useMemo } from "react";
import { GuestBase, GuestRecord, BankInfo } from "@/types/guest";
import initialGuests from "@/data/guests.json";

const STORAGE_KEY = "wedding_money_records";

export function useGuestData() {
  const [records, setRecords] = useState<Record<string, GuestRecord>>({});
  const [customGuests, setCustomGuests] = useState<GuestBase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecords(parsed.records || {});
        setCustomGuests(parsed.customGuests || []);
      } catch (e) {
        console.error("Failed to parse stored records");
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever records change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ records, customGuests }));
    }
  }, [records, customGuests, isLoaded]);

  // Combine initial guests with custom guests
  const allBaseGuests = useMemo((): GuestBase[] => {
    return [...(initialGuests as GuestBase[]), ...customGuests];
  }, [customGuests]);

  // Get all guests with their records
  const guests = useMemo((): GuestRecord[] => {
    return allBaseGuests.map((guest) => ({
      ...guest,
      displayName: records[guest.id]?.displayName ?? guest.name,
      amountRiel: records[guest.id]?.amountRiel ?? null,
      paymentType: records[guest.id]?.paymentType ?? "cash",
      bank: records[guest.id]?.bank ?? null,
      note: records[guest.id]?.note ?? "",
      updatedAt: records[guest.id]?.updatedAt ?? null,
    }));
  }, [allBaseGuests, records]);

  // Split guests into pending and recorded
  const pendingGuests = useMemo(() => {
    return guests.filter((g) => g.amountRiel === null || g.amountRiel === 0);
  }, [guests]);

  const recordedGuests = useMemo(() => {
    return guests.filter((g) => g.amountRiel !== null && g.amountRiel > 0);
  }, [guests]);

  // Save guest record
  const saveGuest = useCallback(
    (
      guestId: string,
      amountRiel: number | null,
      paymentType: "cash" | "bank",
      bank: BankInfo | null,
      note: string,
      displayName?: string
    ) => {
      const guest = allBaseGuests.find((g) => g.id === guestId);
      if (!guest) return;

      setRecords((prev) => ({
        ...prev,
        [guestId]: {
          id: guestId,
          name: guest.name,
          side: guest.side,
          displayName: displayName ?? prev[guestId]?.displayName ?? guest.name,
          amountRiel,
          paymentType,
          bank,
          note,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [allBaseGuests]
  );

  // Create new guest
  const createGuest = useCallback((name: string, side: "groom" | "bride") => {
    const newId = `NEW_${Date.now()}`;
    const newGuest: GuestBase = { id: newId, name, side };
    setCustomGuests((prev) => [...prev, newGuest]);
    return newGuest;
  }, []);

  // Check if guest has existing data
  const hasExistingData = useCallback(
    (guestId: string): boolean => {
      const record = records[guestId];
      return !!(record && record.amountRiel !== null && record.amountRiel > 0);
    },
    [records]
  );

  // Calculate totals and statistics
  const totals = useMemo(() => {
    let totalCash = 0;
    let totalBank = 0;
    let cashCount = 0;
    let bankCount = 0;

    Object.values(records).forEach((record) => {
      if (record.amountRiel !== null && record.amountRiel > 0) {
        if (record.paymentType === "cash") {
          totalCash += record.amountRiel;
          cashCount++;
        } else {
          totalBank += record.amountRiel;
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
  }, [records]);

  // Export to CSV
  const exportCSV = useCallback(() => {
    const headers = ["ឈ្មោះ", "ឈ្មោះបង្ហាញ", "ភ្ញៀវខាង", "ចំនួនប្រាក់ (៛)", "ប្រភេទទូទាត់", "ធនាគារ", "លេខប្រតិបត្តិការ", "ចំណាំ", "ពេលវេលា"];
    const rows = guests
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
  }, [guests]);

  return {
    guests,
    pendingGuests,
    recordedGuests,
    records,
    saveGuest,
    createGuest,
    hasExistingData,
    totals,
    exportCSV,
    isLoaded,
  };
}