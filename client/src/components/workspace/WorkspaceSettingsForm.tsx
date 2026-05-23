import { useState, useEffect } from "react";
import { Loader2, Copy, Check, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandingEditor } from "@/components/workspace/BrandingEditor";
import { useWorkspace, useUpdateWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface WorkspaceSettingsFormProps {
  showBranding?: boolean;
  showBrandingOnly?: boolean;
}

export function WorkspaceSettingsForm({ showBranding = true, showBrandingOnly = false }: WorkspaceSettingsFormProps) {
  const { data: workspace, isLoading } = useWorkspace();
  const updateWorkspace = useUpdateWorkspace();

  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setAgencyName(workspace.agencyName || "");
      setPrimaryColor(workspace.primaryColor || "#6366F1");
      setLogoUrl(workspace.logoUrl || "");
      setCustomDomain(workspace.customDomain || "");
    }
  }, [workspace]);

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
        folder: string; uploadPreset: string; cloudName: string;
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
    try {
      await updateWorkspace.mutateAsync({
        name: name.trim(),
        agencyName: agencyName.trim() || null,
        primaryColor,
        logoUrl: logoUrl || null,
      });
      toast({ title: "Settings saved" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save settings" });
    }
  };

  const handleSaveDomain = async () => {
    setSavingDomain(true);
    try {
      await updateWorkspace.mutateAsync({
        customDomain: customDomain.trim() || null,
      });
      toast({ title: "Custom domain saved" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save domain" });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleCopySlug = () => {
    if (!workspace?.slug) return;
    navigator.clipboard.writeText(`${workspace.slug}.portal.shipdesk.io`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              />
            </div>

            <div className="space-y-2">
              <Label>Portal URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={workspace?.slug ? `${workspace.slug}.portal.shipdesk.io` : ""}
                  readOnly
                  className="font-mono bg-muted text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopySlug} className="flex-shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Subdomain is permanent and cannot be changed.</p>
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
              onColorChange={setPrimaryColor}
              uploadingLogo={uploadingLogo}
            />
          </CardContent>
        </Card>
      )}

      {!showBrandingOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Point your own domain to your client portal. DNS routing setup is required separately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Domain</Label>
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="portal.youragency.com"
                className="font-mono text-sm"
              />
            </div>
            <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">DNS Setup Instructions</p>
              <p>Add a <span className="font-mono bg-background border rounded px-1">CNAME</span> record pointing your domain to:</p>
              <p className="font-mono bg-background border rounded px-2 py-1 select-all">
                {workspace?.slug ? `${workspace.slug}.portal.shipdesk.io` : "your-slug.portal.shipdesk.io"}
              </p>
              <p className="flex items-center gap-1 mt-1">
                DNS changes may take up to 48 hours to propagate.
                <a
                  href="https://docs.shipdesk.io/custom-domain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDomain}
              disabled={savingDomain}
              className="gap-1.5"
              data-testid="button-save-custom-domain"
            >
              {savingDomain ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Domain"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSave}
        disabled={!name.trim() || updateWorkspace.isPending}
        className="w-full"
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
