import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366F1", "#8B5CF6", "#0EA5E9", "#10B981",
  "#F59E0B", "#F43F5E", "#475569", "#18181B",
];

interface BrandingEditorProps {
  logoUrl: string;
  primaryColor: string;
  onLogoChange: (file: File) => void;
  onColorChange: (color: string) => void;
  uploadingLogo?: boolean;
}

export function BrandingEditor({ logoUrl, primaryColor, onLogoChange, onColorChange, uploadingLogo }: BrandingEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Agency Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative">
              <img
                src={logoUrl}
                alt="Agency logo"
                className="h-14 w-auto max-w-[120px] object-contain rounded-lg border bg-white p-1"
              />
            </div>
          ) : (
            <div className="h-14 w-14 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
              <Upload className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}

          <div>
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingLogo}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              {uploadingLogo ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="h-4 w-4" />{logoUrl ? "Change Logo" : "Upload Logo"}</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG · Max 2 MB</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLogoChange(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-3">
        <Label>Brand Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all duration-150 hover:scale-110",
                primaryColor === color ? "border-foreground scale-110 shadow-md" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              aria-label={color}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border shadow-sm flex-shrink-0" style={{ backgroundColor: primaryColor }} />
          <Input
            value={primaryColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-28 font-mono text-sm"
            placeholder="#6366F1"
            maxLength={7}
          />
          <p className="text-xs text-muted-foreground">Used in your client portal theme</p>
        </div>
      </div>
    </div>
  );
}
