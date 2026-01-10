import { memo, useRef, useState } from "react";
import { Download, Upload, FileJson, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

interface BackupActionsProps {
  onExportCSV: () => void;
  onExportJSON: () => Promise<void>;
  onImportJSON: (file: File) => Promise<{ success: boolean; message: string }>;
}

export const BackupActions = memo(function BackupActions({
  onExportCSV,
  onExportJSON,
  onImportJSON,
}: BackupActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleExportJSON = async () => {
    try {
      await onExportJSON();
      toast.success("បានរក្សាទុកជា JSON");
    } catch (e) {
      toast.error("កំហុសក្នុងការរក្សាទុក");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowImportConfirm(true);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;

    setIsImporting(true);
    try {
      const result = await onImportJSON(pendingFile);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("កំហុសក្នុងការនាំចូល");
    } finally {
      setIsImporting(false);
      setPendingFile(null);
      setShowImportConfirm(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        className="hidden"
      />

      {/* Export CSV */}
      <Button
        variant="secondary"
        onClick={onExportCSV}
        className="w-full h-12"
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>

      {/* Export JSON Backup */}
      <Button
        variant="outline"
        onClick={handleExportJSON}
        className="w-full h-12"
      >
        <FileJson className="h-4 w-4 mr-2" />
        💾 រក្សាទុក Backup (JSON)
      </Button>

      {/* Import JSON Backup */}
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-12"
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        📥 នាំចូល Backup (JSON)
      </Button>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ បញ្ជាក់ការនាំចូល</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                តើអ្នកប្រាកដថាចង់នាំចូលឯកសារ <strong>{pendingFile?.name}</strong>?
              </p>
              <p className="text-yellow-600">
                ទិន្នន័យថ្មីនឹងបញ្ចូលបន្ថែមលើទិន្នន័យចាស់។
                ប្រសិនបើមានភ្ញៀវដូចគ្នា ទិន្នន័យថ្មីជាងនឹងជំនួស។
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>បោះបង់</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="bg-primary"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              បញ្ជាក់នាំចូល
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
