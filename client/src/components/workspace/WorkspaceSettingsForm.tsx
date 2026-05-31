import { useState, useEffect, useCallback } from "react";
import { Loader2, Copy, Check, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandingEditor } from "@/components/workspace/BrandingEditor";
import { useWorkspace, useUpdateWorkspace, useCheckSubdomain } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface WorkspaceSettingsFormProps {
  showBranding?: boolean;
  showBrandingOnly?: boolean;
}

function getPortalBase(): string {
  const envUrl = import.meta.env.VITE_FRONTEND_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return window.location.origin;
}

export function WorkspaceSettingsForm({ showBranding = true, showBrandingOnly = false }: WorkspaceSettingsFormProps) {
  const { data: workspace, isLoading } = useWorkspace();
  const updateWorkspace = useUpdateWorkspace();

  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [logoUrl, setLogoUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);

  const slugChanged = slug !== (workspace?.slug ?? "");
  const { data: slugCheck, isFetching: checkingSlug } = useCheckSubdomain(
    debouncedSlug.length >= 3 && slugChanged ? debouncedSlug : ""
  );

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setAgencyName(workspace.agencyName || "");
      setPrimaryColor(workspace.primaryColor || "#6366F1");
      setLogoUrl(workspace.logoUrl || "");
      setSlug(workspace.slug || "");
      setDebouncedSlug(workspace.slug || "");
    }
  }, [workspace]);

  const debouncedSlugUpdate = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (val: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => setDebouncedSlug(val), 600);
      };
    })(),
    []
  );

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    if (cleaned.length > 0 && cleaned.length < 3) {
      setSlugError("Must be at least 3 characters");
    } else if (cleaned.length > 30) {
      setSlugError("Must be 30 characters or fewer");
    } else {
      setSlugError(null);
    }
    debouncedSlugUpdate(cleaned);
  };

  const slugTaken = slugChanged && !checkingSlug && debouncedSlug.length >= 3 && slugCheck?.available === false;
  const slugAvailable = slugChanged && !checkingSlug && debouncedSlug.length >= 3 && slugCheck?.available === true;

  const handleLogoUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Logo must be under 2 MB" });
      return;
    }
    setUploadingLogo(true);
    try {
      const sigResp = await api.get("/api/workspace/logo-upload-signature");
      const sig = sigResp.data as {
        apiKey: string; timestamp: number; signature: string;
        folder: string; uploadPreset: string | null; cloudName: string;
      };

      if (!sig.cloudName || !sig.apiKey) {
        toast({ variant: "destructive", title: "Upload failed", description: "Cloudinary is not configured on the server." });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      if (sig.uploadPreset) formData.append("upload_preset", sig.uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: formData });
      const data = await res.json() as { secure_url?: string; error?: { message: string } };

      if (!res.ok || !data.secure_url) {
        const reason = data.error?.message || `Cloudinary error (${res.status})`;
        toast({ variant: "destructive", title: "Upload failed", description: reason });
        return;
      }

      setLogoUrl(data.secure_url);
      toast({ title: "Logo uploaded" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please try again";
      toast({ variant: "destructive", title: "Upload failed", description: msg });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (slugError || !slug.trim() || slugTaken) return;
    try {
      await updateWorkspace.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        agencyName: agencyName.trim() || null,
        primaryColor,
        logoUrl: logoUrl || null,
      });
      toast({ title: "Settings saved" });
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "SLUG_TAKEN") {
        setSlugError("This subdomain is already taken");
      } else {
        toast({ variant: "destructive", title: "Failed to save settings" });
      }
    }
  };

  const handleCopySlug = () => {
    if (!workspace?.slug) return;
    const url = `${getPortalBase()}/portal/${workspace.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSaveDisabled =
    !name.trim() ||
    !slug.trim() ||
    !!slugError ||
    slugTaken ||
    checkingSlug ||
    updateWorkspace.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showBrandingOnly && (
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Your workspace name and portal subdomain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace Name *</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="My Dev Studio"
                data-testid="input-workspace-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ws-agency">Agency Name</Label>
              <Input
                id="ws-agency"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Shown to clients in the portal"
                maxLength={80}
                data-testid="input-agency-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ws-slug">Portal URL</Label>
              <div className="flex items-center gap-2">
                <div className={`flex items-center flex-1 border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 ${slugError || slugTaken ? "border-destructive" : slugAvailable ? "border-emerald-500" : ""}`}>
                  <span className="px-3 py-2 text-xs font-mono text-muted-foreground bg-muted border-r select-none whitespace-nowrap">
                    {getPortalBase().replace(/^https?:\/\//, "")}/portal/
                  </span>
                  <Input
                    id="ws-slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={`border-0 rounded-none shadow-none font-mono text-sm focus-visible:ring-0 min-w-0 ${slugError || slugTaken ? "text-destructive" : ""}`}
                    placeholder="your-slug"
                    maxLength={30}
                    data-testid="input-portal-slug"
                  />
                  <div className="px-2 flex-shrink-0">
                    {checkingSlug && debouncedSlug.length >= 3 ? (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                    ) : slugAvailable ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : slugTaken ? (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySlug}
                  className="flex-shrink-0"
                  data-testid="button-copy-portal-url"
                  title="Copy portal URL"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {slugError ? (
                <p className="text-xs text-destructive">{slugError}</p>
              ) : slugTaken ? (
                <p className="text-xs text-destructive">This subdomain is already taken</p>
              ) : slugAvailable ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">This subdomain is available</p>
              ) : (
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and hyphens. Min 3 characters.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(showBranding || showBrandingOnly) && (
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize how your portal looks to clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandingEditor
              logoUrl={logoUrl}
              primaryColor={primaryColor}
              onLogoChange={handleLogoUpload}
              onLogoRemove={() => setLogoUrl("")}
              onColorChange={setPrimaryColor}
              uploadingLogo={uploadingLogo}
            />
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSave}
        disabled={isSaveDisabled}
        className="w-full"
        data-testid="button-save-changes"
      >
        {updateWorkspace.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}
