import { useState, useCallback, useEffect } from "react";
import { GuestRecord, BankInfo, GuestFormData, USD_TO_KHR_RATE } from "@/types/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Save, X, Pencil } from "lucide-react";
import { toast } from "sonner";

interface GuestFormProps {
  guest: GuestRecord;
  hasExistingData: boolean;
  onSave: (
    guestId: string,
    amountRiel: number | null,
    paymentType: "cash" | "bank",
    bank: BankInfo | null,
    note: string,
    displayName: string
  ) => void;
  onClose: () => void;
}

function formatKHR(amount: number): string {
  return amount.toLocaleString("km-KH") + "៛";
}

export function GuestForm({
  guest,
  hasExistingData,
  onSave,
  onClose,
}: GuestFormProps) {
  const [formData, setFormData] = useState<GuestFormData>({
    amountInput: guest.amountRiel?.toString() ?? "",
    isUSD: false,
    paymentType: guest.paymentType ?? "cash",
    bankType: guest.bank?.type ?? "",
    bankRef: guest.bank?.ref ?? "",
    note: guest.note ?? "",
    displayName: guest.displayName || guest.name,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Reset form when guest changes
  useEffect(() => {
    setFormData({
      amountInput: guest.amountRiel?.toString() ?? "",
      isUSD: false,
      paymentType: guest.paymentType ?? "cash",
      bankType: guest.bank?.type ?? "",
      bankRef: guest.bank?.ref ?? "",
      note: guest.note ?? "",
      displayName: guest.displayName || guest.name,
    });
    setIsEditingName(false);
  }, [guest]);

  // Calculate Riel amount from input
  const calculatedRiel = useCallback(() => {
    const value = parseFloat(formData.amountInput) || 0;
    if (formData.isUSD) {
      return Math.round(value * USD_TO_KHR_RATE);
    }
    return value;
  }, [formData.amountInput, formData.isUSD]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9.]/g, "");
      setFormData((prev) => ({ ...prev, amountInput: value }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const amountRiel = calculatedRiel();

    // Validate no negative (already prevented by input)
    if (amountRiel < 0) {
      toast.error("សាច់ប្រាក់មិនអាចអវិជ្ជមានបានទេ");
      return;
    }

    // Check if overwriting existing data
    if (hasExistingData) {
      setShowConfirm(true);
      return;
    }

    performSave();
  }, [formData, hasExistingData, calculatedRiel]);

  const performSave = useCallback(() => {
    const amountRiel = calculatedRiel() || null;

    const bank: BankInfo | null =
      formData.paymentType === "bank" && formData.bankType
        ? {
            type: formData.bankType as "ABA" | "ACLEDA",
            ref: formData.bankRef,
          }
        : null;

    onSave(guest.id, amountRiel, formData.paymentType, bank, formData.note, formData.displayName);
    toast.success("បានរក្សាទុកជោគជ័យ ✓");
    onClose();
  }, [formData, guest.id, onSave, onClose, calculatedRiel]);

  const sideLabel = guest.side === "groom" ? "ភ្ញៀវខាងប្រុស" : "ភ្ញៀវខាងស្រី";

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mt-4">
        {/* Guest Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👤</span>
              {isEditingName ? (
                <div className="flex-1">
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    className="h-10 text-lg bg-input border-border"
                    autoFocus
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingName(false);
                    }}
                  />
                  <p className="text-xs text-amber-500 mt-1">
                    ⚠️ ការកែប្រែឈ្មោះ គ្រាន់តែសម្រាប់បង្ហាញ មិនប៉ះពាល់ទឹកប្រាក់ទេ
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-primary">{formData.displayName}</h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-secondary rounded"
                    title="កែប្រែឈ្មោះ"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
            <span className="inline-block mt-1 px-3 py-1 bg-secondary text-muted-foreground text-sm rounded-full">
              🏷️ {sideLabel}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Money Input */}
          <div>
            <Label className="text-base mb-2 flex items-center gap-2">
              💵 {formData.isUSD ? "សាច់ប្រាក់ ($)" : "សាច់ប្រាក់ (៛)"}
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={formData.amountInput}
              onChange={handleAmountChange}
              placeholder={formData.isUSD ? "ឧទាហរណ៍: 50" : "ឧទាហរណ៍: 200000"}
              className="h-14 text-xl bg-input border-border"
            />

            {/* USD Toggle */}
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="usd-toggle"
                checked={formData.isUSD}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isUSD: !!checked }))
                }
              />
              <label htmlFor="usd-toggle" className="text-sm text-muted-foreground cursor-pointer">
                បញ្ចូលជាដុល្លារ ($)
              </label>
            </div>

            {/* Show converted amount when USD */}
            {formData.isUSD && formData.amountInput && (
              <div className="mt-2 px-3 py-2 bg-secondary rounded-lg">
                <span className="text-sm text-muted-foreground">
                  ≈ {formatKHR(calculatedRiel())}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (អត្រា: $1 = {USD_TO_KHR_RATE.toLocaleString()}៛)
                </span>
              </div>
            )}
          </div>

          {/* Payment Type */}
          <div className="border-t border-border pt-4">
            <Label className="text-base mb-3 block">ប្រភេទទូទាត់</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={formData.paymentType === "cash"}
                  onChange={() => setFormData((prev) => ({ ...prev, paymentType: "cash" }))}
                  className="w-5 h-5 accent-primary"
                />
                <span className={formData.paymentType === "cash" ? "text-foreground" : "text-muted-foreground"}>
                  សាច់ប្រាក់
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={formData.paymentType === "bank"}
                  onChange={() => setFormData((prev) => ({ ...prev, paymentType: "bank" }))}
                  className="w-5 h-5 accent-primary"
                />
                <span className={formData.paymentType === "bank" ? "text-foreground" : "text-muted-foreground"}>
                  ប្រាក់បញ្ជូនតាមធនាគារ
                </span>
              </label>
            </div>
          </div>

          {/* Bank Section - Only show when bank is selected */}
          {formData.paymentType === "bank" && (
            <div className="space-y-3 pl-4 border-l-2 border-primary/30">
              <div>
                <Label className="text-sm mb-1 block text-muted-foreground">ប្រភេទធនាគារ</Label>
                <Select
                  value={formData.bankType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankType: value as "ABA" | "ACLEDA" | "",
                    }))
                  }
                >
                  <SelectTrigger className="h-12 bg-input border-border">
                    <SelectValue placeholder="ប្រភេទធនាគារ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABA">ABA</SelectItem>
                    <SelectItem value="ACLEDA">ACLEDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm mb-1 block text-muted-foreground">លេខប្រតិបត្តិការ</Label>
                <Input
                  type="text"
                  value={formData.bankRef}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bankRef: e.target.value }))
                  }
                  placeholder="លេខប្រតិបត្តិការ (ស្រេចចិត្ត)"
                  className="h-12 bg-input border-border"
                />
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <Label className="text-base mb-2 flex items-center gap-2">
              📝 កំណត់ចំណាំ (ស្រេចចិត្ត)
            </Label>
            <Textarea
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="ចំណាំបន្ថែម..."
              className="bg-input border-border resize-none"
              rows={2}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-bold"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            💾 រក្សាទុក
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">
              ⚠️ កែប្រែទិន្នន័យ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              ភ្ញៀវនេះមានទិន្នន័យរួចហើយ តើអ្នកចង់កែប្រែទេ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border">
              បោះបង់
            </AlertDialogCancel>
            <AlertDialogAction onClick={performSave}>
              ✏️ កែប្រែ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}