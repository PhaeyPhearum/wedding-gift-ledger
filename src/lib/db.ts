import { openDB, DBSchema, IDBPDatabase } from "idb";
import { GuestRecordDB, SyncStatus, BackupData } from "@/types/sync";
import initialGuests from "@/data/guests.json";
import { GuestBase } from "@/types/guest";

const DB_NAME = "wedding_gift_db";
const DB_VERSION = 1;
const STORE_NAME = "guests";

interface WeddingDB extends DBSchema {
  guests: {
    key: string;
    value: GuestRecordDB;
    indexes: {
      "by-sync-status": SyncStatus;
      "by-updated": number;
      "by-side": "groom" | "bride";
    };
  };
}

let dbInstance: IDBPDatabase<WeddingDB> | null = null;

// Initialize database
export async function initDB(): Promise<IDBPDatabase<WeddingDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WeddingDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create guests store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-sync-status", "syncStatus");
        store.createIndex("by-updated", "updatedAt");
        store.createIndex("by-side", "side");
      }
    },
  });

  // Initialize with default guests if empty
  const count = await dbInstance.count(STORE_NAME);
  if (count === 0) {
    await seedInitialGuests(dbInstance);
  }

  return dbInstance;
}

// Seed initial guests from JSON
async function seedInitialGuests(db: IDBPDatabase<WeddingDB>): Promise<void> {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const guests = initialGuests as GuestBase[];
  const now = Date.now();

  for (const guest of guests) {
    const record: GuestRecordDB = {
      id: guest.id,
      name: guest.name,
      displayName: guest.name,
      side: guest.side,
      amountRiel: null,
      paymentType: "cash",
      bankType: null,
      bankRef: null,
      note: "",
      updatedAt: now,
      syncStatus: "local",
      lastSyncedAt: null,
      isCustomGuest: false,
    };
    await store.put(record);
  }

  await tx.done;
  console.log(`[DB] Seeded ${guests.length} initial guests`);
}

// Get all guests
export async function getAllGuests(): Promise<GuestRecordDB[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

// Get single guest
export async function getGuest(id: string): Promise<GuestRecordDB | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

// Save guest record (IndexedDB-first, NEVER fails silently)
export async function saveGuestRecord(
  id: string,
  updates: Partial<Omit<GuestRecordDB, "id">>
): Promise<GuestRecordDB> {
  const db = await initDB();
  
  // Get existing or create new
  let existing = await db.get(STORE_NAME, id);
  
  if (!existing) {
    throw new Error(`Guest ${id} not found`);
  }

  const updated: GuestRecordDB = {
    ...existing,
    ...updates,
    id, // Ensure ID never changes
    updatedAt: Date.now(),
    syncStatus: "pending", // Mark for sync
  };

  await db.put(STORE_NAME, updated);
  console.log(`[DB] Saved guest: ${id}`, updated);
  
  return updated;
}

// Create new custom guest
export async function createCustomGuest(
  name: string,
  side: "groom" | "bride"
): Promise<GuestRecordDB> {
  const db = await initDB();
  const id = `CUSTOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newGuest: GuestRecordDB = {
    id,
    name,
    displayName: name,
    side,
    amountRiel: null,
    paymentType: "cash",
    bankType: null,
    bankRef: null,
    note: "",
    updatedAt: Date.now(),
    syncStatus: "pending",
    lastSyncedAt: null,
    isCustomGuest: true,
  };

  await db.put(STORE_NAME, newGuest);
  console.log(`[DB] Created custom guest: ${id}`, newGuest);
  
  return newGuest;
}

// Get guests by sync status
export async function getGuestsBySyncStatus(
  status: SyncStatus
): Promise<GuestRecordDB[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, "by-sync-status", status);
}

// Get pending sync count
export async function getPendingSyncCount(): Promise<number> {
  const pending = await getGuestsBySyncStatus("pending");
  const local = await getGuestsBySyncStatus("local");
  return pending.length + local.length;
}

// Mark records as synced
export async function markAsSynced(ids: string[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const now = Date.now();

  for (const id of ids) {
    const record = await store.get(id);
    if (record) {
      record.syncStatus = "synced";
      record.lastSyncedAt = now;
      await store.put(record);
    }
  }

  await tx.done;
}

// Mark record as error
export async function markAsError(id: string): Promise<void> {
  const db = await initDB();
  const record = await db.get(STORE_NAME, id);
  if (record) {
    record.syncStatus = "error";
    await db.put(STORE_NAME, record);
  }
}

// Export all data for backup
export async function exportBackup(): Promise<BackupData> {
  const guests = await getAllGuests();
  const pendingCount = guests.filter(
    (g) => g.syncStatus === "pending" || g.syncStatus === "local"
  ).length;

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    guests,
    metadata: {
      totalRecords: guests.length,
      pendingSync: pendingCount,
    },
  };
}

// Import backup data
export async function importBackup(data: BackupData): Promise<{
  imported: number;
  skipped: number;
  errors: number;
}> {
  const db = await initDB();
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const guest of data.guests) {
    try {
      const existing = await store.get(guest.id);
      
      // Only import if newer (last write wins)
      if (!existing || guest.updatedAt > existing.updatedAt) {
        await store.put({
          ...guest,
          syncStatus: "pending", // Will need to sync after import
        });
        imported++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`[DB] Error importing guest ${guest.id}:`, e);
      errors++;
    }
  }

  await tx.done;
  console.log(`[DB] Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
  
  return { imported, skipped, errors };
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await db.clear(STORE_NAME);
  console.log("[DB] All data cleared");
}

// Migrate from localStorage (one-time migration)
export async function migrateFromLocalStorage(): Promise<boolean> {
  const STORAGE_KEY = "wedding_money_records";
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) return false;

  try {
    const parsed = JSON.parse(stored);
    const records = parsed.records || {};
    const customGuests = parsed.customGuests || [];
    
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();

    // Migrate custom guests
    for (const guest of customGuests) {
      const existing = await store.get(guest.id);
      if (!existing) {
        await store.put({
          id: guest.id,
          name: guest.name,
          displayName: guest.name,
          side: guest.side,
          amountRiel: null,
          paymentType: "cash",
          bankType: null,
          bankRef: null,
          note: "",
          updatedAt: now,
          syncStatus: "pending",
          lastSyncedAt: null,
          isCustomGuest: true,
        });
      }
    }

    // Migrate records
    for (const [id, record] of Object.entries(records)) {
      const r = record as any;
      const existing = await store.get(id);
      if (existing) {
        await store.put({
          ...existing,
          displayName: r.displayName || existing.displayName,
          amountRiel: r.amountRiel,
          paymentType: r.paymentType || "cash",
          bankType: r.bank?.type || null,
          bankRef: r.bank?.ref || null,
          note: r.note || "",
          updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : now,
          syncStatus: "pending",
        });
      }
    }

    await tx.done;
    
    // Remove old localStorage after successful migration
    localStorage.removeItem(STORAGE_KEY);
    console.log("[DB] Migration from localStorage complete");
    
    return true;
  } catch (e) {
    console.error("[DB] Migration failed:", e);
    return false;
  }
}
