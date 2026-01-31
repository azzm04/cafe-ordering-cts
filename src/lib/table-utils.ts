// src/lib/table-utils.ts

/**
 * Database table status (Indonesian)
 */
export type DBTableStatus = "tersedia" | "terisi" | "dipesan";

/**
 * Application table status (English) 
 * Used in manual-order and other features
 */
export type AppTableStatus = "available" | "occupied" | "reserved";

/**
 * Maps database status (Indonesian) to application status (English)
 */
export function mapDBStatusToApp(dbStatus: DBTableStatus): AppTableStatus {
  const mapping: Record<DBTableStatus, AppTableStatus> = {
    tersedia: "available",
    terisi: "occupied",
    dipesan: "reserved",
  };
  return mapping[dbStatus];
}

/**
 * Maps application status (English) to database status (Indonesian)
 */
export function mapAppStatusToDB(appStatus: AppTableStatus): DBTableStatus {
  const mapping: Record<AppTableStatus, DBTableStatus> = {
    available: "tersedia",
    occupied: "terisi",
    reserved: "dipesan",
  };
  return mapping[appStatus];
}

/**
 * Database table structure (as stored in Supabase)
 */
export interface DBTable {
  id: string;
  table_number: number;
  status: DBTableStatus;
  created_at: string;
}

/**
 * Application table structure (used in manual-order components)
 */
export interface AppTable {
  id: string;
  table_number: number;
  status: AppTableStatus;
}

/**
 * Converts a database table object to application format
 */
export function convertDBTableToApp(dbTable: DBTable): AppTable {
  return {
    id: dbTable.id,
    table_number: dbTable.table_number,
    status: mapDBStatusToApp(dbTable.status),
  };
}

/**
 * Converts multiple database tables to application format
 */
export function convertDBTablesToApp(dbTables: DBTable[]): AppTable[] {
  return dbTables.map(convertDBTableToApp);
}

/**
 * Converts application table to database format
 * (Useful when updating table status from the app)
 */
export function convertAppTableToDB(appTable: AppTable): Partial<DBTable> {
  return {
    id: appTable.id,
    table_number: appTable.table_number,
    status: mapAppStatusToDB(appTable.status),
  };
}

/**
 * Helper to check if a table is available
 */
export function isTableAvailable(table: AppTable | DBTable): boolean {
  return table.status === "available" || table.status === "tersedia";
}

/**
 * Helper to check if a table is occupied
 */
export function isTableOccupied(table: AppTable | DBTable): boolean {
  return table.status === "occupied" || table.status === "terisi";
}

/**
 * Helper to check if a table is reserved
 */
export function isTableReserved(table: AppTable | DBTable): boolean {
  return table.status === "reserved" || table.status === "dipesan";
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: AppTableStatus | DBTableStatus, locale: "id" | "en" = "id"): string {
  const labels = {
    available: { id: "Tersedia", en: "Available" },
    occupied: { id: "Terisi", en: "Occupied" },
    reserved: { id: "Dipesan", en: "Reserved" },
    tersedia: { id: "Tersedia", en: "Available" },
    terisi: { id: "Terisi", en: "Occupied" },
    dipesan: { id: "Dipesan", en: "Reserved" },
  };
  
  return labels[status][locale];
}