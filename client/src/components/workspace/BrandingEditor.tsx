import { useRef } from "react";
import { Loader2, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366F1", "#8B5CF6", "#0EA5E9", "#10B981",
  "#F59E0B", "#F43F5E", "#475569", "#18181B",
];

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

interface BrandingEditorProps {
  logoUrl: string;
  primaryColor: string;
  onLogoChange: (file: File) => void;
  onLogoRemove: () => void;
  onColorChange: (color: string) => void;
  uploadingLogo?: boolean;
}

export function BrandingEditor({ logoUrl, primaryColor, onLogoChange, onLogoRemove, onColorChange, uploadingLogo }: BrandingEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorValid = HEX_RE.test(primaryColor);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Agency Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative group">
              <img
                src={logoUrl}
                alt="Agency logo"
                className="h-14 w-auto max-w-[120px] object-contain rounded-lg border bg-white p-1"
              />
              <button
                type="button"
                onClick={onLogoRemove}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                title="Remove logo"
                data-testid="button-remove-logo"
              >
                <X className="h-3 w-3" />
              </button>
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
              data-testid="button-upload-logo"
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
              data-testid={`button-color-${color.replace("#", "")}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn("w-8 h-8 rounded-lg border shadow-sm flex-shrink-0", !colorValid && "opacity-30")}
            style={{ backgroundColor: colorValid ? primaryColor : "#6366F1" }}
          />
          <div className="relative flex items-center">
            <Input
              value={primaryColor}
              onChange={(e) => onColorChange(e.target.value)}
              className={cn("w-28 font-mono text-sm", !colorValid && "border-destructive focus-visible:ring-destructive")}
              placeholder="#6366F1"
              maxLength={7}
              data-testid="input-brand-color"
            />
            {!colorValid && primaryColor.length > 1 && (
              <AlertCircle className="h-3.5 w-3.5 text-destructive absolute right-2" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Used in your client portal theme</p>
        </div>
        {!colorValid && primaryColor.length > 1 && (
          <p className="text-xs text-destructive">Enter a valid hex color (e.g. #6366F1)</p>
        )}
      </div>
    </div>
  );
}
