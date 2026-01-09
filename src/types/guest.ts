export interface GuestBase {
  id: string;
  name: string;
  side: "groom" | "bride";
}

export interface BankInfo {
  type: "ABA" | "ACLEDA";
  ref: string;
}

export interface GuestRecord extends GuestBase {
  displayName: string; // Editable name for display
  amountRiel: number | null;
  paymentType: "cash" | "bank";
  bank: BankInfo | null;
  note: string;
  updatedAt: string | null;
}

export interface GuestFormData {
  amountInput: string;
  isUSD: boolean;
  paymentType: "cash" | "bank";
  bankType: "ABA" | "ACLEDA" | "";
  bankRef: string;
  note: string;
  displayName: string;
}

// Fixed exchange rate (configurable)
export const USD_TO_KHR_RATE = 4100;
