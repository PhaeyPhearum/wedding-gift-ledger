import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Lock, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { USD_TO_KHR_RATE } from "@/types/guest";

interface HeaderProps {
  totalCash: number;
  totalBank: number;
  grandTotal: number;
  contributorCount: number;
  cashCount: number;
  bankCount: number;
  cashPercent: number;
  bankPercent: number;
}

const SUMMARY_PASSWORD = "8:Leader@";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 60000; // 1 minute lock

function formatKHR(amount: number): string {
  return amount.toLocaleString("km-KH") + "៛";
}

function formatUSD(amountKHR: number): string {
  return "$" + Math.round(amountKHR / USD_TO_KHR_RATE).toLocaleString("en-US");
}

export const Header = memo(function Header({
  totalCash,
  totalBank,
  grandTotal,
  contributorCount,
  cashCount,
  bankCount,
  cashPercent,
  bankPercent,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEndTime, setLockEndTime] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handlePasswordSubmit = useCallback(() => {
    if (isLocked) return;
    
    if (password === SUMMARY_PASSWORD) {
      setIsUnlocked(true);
      setPassword("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword("");
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        const endTime = Date.now() + LOCK_DURATION;
        setLockEndTime(endTime);
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
          setLockEndTime(null);
        }, LOCK_DURATION);
      }
    }
  }, [password, attempts, isLocked]);

  const handleClose = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsUnlocked(false);
      setPassword("");
    }
  }, []);

  const copyToClipboard = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-4 shadow-lg">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              💰 កត់ចំណងដៃ
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ភ្ញៀវបានកត់៖ {contributorCount} នាក់
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                មើលសរុប
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-primary text-center flex items-center justify-center gap-2">
                  🔒 សរុបទិន្នន័យ (សម្ងាត់)
                </DialogTitle>
              </DialogHeader>
              
              {!isUnlocked ? (
                <div className="space-y-4 py-4">
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      បញ្ចូលពាក្យសម្ងាត់ដើម្បីមើលសរុប
                    </p>
                  </div>
                  
                  <Input
                    type="password"
                    placeholder="ពាក្យសម្ងាត់..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                    disabled={isLocked}
                    className="text-center text-lg"
                  />
                  
                  {isLocked ? (
                    <p className="text-destructive text-sm text-center">
                      ព្យាយាមច្រើនពេក។ សូមរង់ចាំ ១ នាទី។
                    </p>
                  ) : attempts > 0 ? (
                    <p className="text-destructive text-sm text-center">
                      ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។ នៅសល់ {remainingAttempts} ដង។
                    </p>
                  ) : null}
                  
                  <Button 
                    onClick={handlePasswordSubmit} 
                    disabled={isLocked || !password}
                    className="w-full"
                  >
                    បើក
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  {/* Cash Total */}
                  <div className="bg-secondary rounded-lg px-4 py-3">
                    <span className="text-sm text-muted-foreground block">សរុបសាច់ប្រាក់ សុទ្ធ</span>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-primary">{formatKHR(totalCash)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(totalCash.toString(), "cash")}
                      >
                        {copiedField === "cash" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Bank Total */}
                  <div className="bg-secondary rounded-lg px-4 py-3">
                    <span className="text-sm text-muted-foreground block">សរុបសាច់ប្រាក់ តាមធនាគារ</span>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-primary">{formatKHR(totalBank)}</p>
                        <p className="text-sm text-muted-foreground">{formatUSD(totalBank)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(totalBank.toString(), "bank")}
                      >
                        {copiedField === "bank" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t border-border my-3" />
                  
                  {/* Grand Total */}
                  <div className="bg-primary/10 rounded-lg px-4 py-3">
                    <span className="text-sm text-muted-foreground block">សរុបទាំងអស់</span>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">{formatKHR(grandTotal)}</p>
                        <p className="text-lg text-primary/80">{formatUSD(grandTotal)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(grandTotal.toString(), "total")}
                      >
                        {copiedField === "total" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      អត្រាបម្លែង៖ 1$ = {USD_TO_KHR_RATE.toLocaleString("km-KH")}៛
                    </p>
                  </div>

                  <div className="border-t border-border my-3" />

                  {/* Statistics */}
                  <div className="bg-secondary rounded-lg px-4 py-3 space-y-2">
                    <span className="text-sm text-muted-foreground block font-medium">ស្ថិតិអ្នកកត់ប្រាក់</span>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">សាច់ប្រាក់៖</span>
                        <span className="text-primary font-bold ml-2">{cashCount} នាក់</span>
                        <span className="text-muted-foreground ml-1">({cashPercent}%)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ធនាគារ៖</span>
                        <span className="text-primary font-bold ml-2">{bankCount} នាក់</span>
                        <span className="text-muted-foreground ml-1">({bankPercent}%)</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">សរុបអ្នកកត់៖</span>
                      <span className="text-primary font-bold ml-2">{contributorCount} នាក់</span>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
});