import { useState, useMemo, useCallback } from "react";
import { useGuestData } from "@/hooks/useGuestData";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { GuestList } from "@/components/GuestList";
import { GuestForm } from "@/components/GuestForm";
import { GuestTabs } from "@/components/GuestTabs";
import { Button } from "@/components/ui/button";
import { GuestRecord, BankInfo } from "@/types/guest";
import { Download } from "lucide-react";

const Index = () => {
  const {
    pendingGuests,
    recordedGuests,
    saveGuest,
    createGuest,
    hasExistingData,
    totals,
    exportCSV,
    isLoaded,
  } = useGuestData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "recorded">("pending");

  // Get current tab's guests
  const currentGuests = activeTab === "pending" ? pendingGuests : recordedGuests;

  // Filter guests based on search (searches across ALL guests regardless of tab)
  const filteredGuests = useMemo(() => {
    const allGuests = [...pendingGuests, ...recordedGuests];
    if (!searchQuery.trim()) {
      return currentGuests;
    }
    const query = searchQuery.toLowerCase().trim();
    // When searching, search all guests and show results
    return allGuests.filter((guest) => {
      const displayName = guest.displayName || guest.name;
      return displayName.toLowerCase().includes(query) || guest.name.toLowerCase().includes(query);
    });
  }, [pendingGuests, recordedGuests, currentGuests, searchQuery]);

  const handleSelectGuest = useCallback((guest: GuestRecord) => {
    setSelectedGuest(guest);
  }, []);

  const handleCloseForm = useCallback(() => {
    setSelectedGuest(null);
  }, []);

  const handleSave = useCallback(
    (
      guestId: string,
      amountRiel: number | null,
      paymentType: "cash" | "bank",
      bank: BankInfo | null,
      note: string,
      displayName: string
    ) => {
      saveGuest(guestId, amountRiel, paymentType, bank, note, displayName);
    },
    [saveGuest]
  );

  const handleCreateGuest = useCallback(
    (name: string, side: "groom" | "bride") => {
      const newGuest = createGuest(name, side);
      // Return as GuestRecord with default values
      return {
        ...newGuest,
        displayName: name,
        amountRiel: null,
        paymentType: "cash" as const,
        bank: null,
        note: "",
        updatedAt: null,
      };
    },
    [createGuest]
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-xl">កំពុងផ្ទុក...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        totalCash={totals.totalCash}
        totalBank={totals.totalBank}
        grandTotal={totals.grandTotal}
        contributorCount={totals.contributorCount}
        cashCount={totals.cashCount}
        bankCount={totals.bankCount}
        cashPercent={totals.cashPercent}
        bankPercent={totals.bankPercent}
      />

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="mb-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Tabs - only show when not searching */}
        {!searchQuery.trim() && !selectedGuest && (
          <GuestTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={pendingGuests.length}
            recordedCount={recordedGuests.length}
          />
        )}

        {/* Selected Guest Form */}
        {selectedGuest && (
          <GuestForm
            guest={selectedGuest}
            hasExistingData={hasExistingData(selectedGuest.id)}
            onSave={handleSave}
            onClose={handleCloseForm}
          />
        )}

        {/* Guest List */}
        {!selectedGuest && (
          <GuestList
            guests={filteredGuests}
            onSelect={handleSelectGuest}
            selectedId={selectedGuest?.id ?? null}
            searchQuery={searchQuery}
            onCreateGuest={handleCreateGuest}
            showRecorded={activeTab === "recorded"}
          />
        )}

        {/* Export Button */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={exportCSV}
            className="w-full h-12"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;