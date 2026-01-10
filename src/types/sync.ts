// Sync status types for offline-first architecture
export type SyncStatus = "synced" | "local" | "pending" | "error";

export interface SyncableRecord {
  id: string;
  syncStatus: SyncStatus;
  updatedAt: number; // Unix timestamp for conflict resolution
  lastSyncedAt: number | null;
}

export interface GuestRecordDB {
  id: string;
  name: string; // Original name (read-only)
  displayName: string;
  side: "groom" | "bride";
  amountRiel: number | null;
  paymentType: "cash" | "bank";
  bankType: "ABA" | "ACLEDA" | null;
  bankRef: string | null;
  note: string;
  updatedAt: number; // Unix timestamp
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  isCustomGuest: boolean; // true if created by user
}

export interface BackupData {
  version: number;
  exportedAt: string;
  guests: GuestRecordDB[];
  metadata: {
    totalRecords: number;
    pendingSync: number;
  };
}

// Global sync state
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  errorCount: number;
}
