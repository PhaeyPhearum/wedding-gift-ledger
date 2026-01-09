import { memo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = memo(function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ស្វែងរកឈ្មោះភ្ញៀវ..."
        className="pl-12 pr-12 h-14 text-lg bg-card border-border focus:border-primary focus:ring-primary"
        autoComplete="off"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});
