import { useState, useEffect } from "react";
import { Loader2, Copy, Check } from "lucide-react";
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setAgencyName(workspace.agencyName || "");
      setPrimaryColor(workspace.primaryColor || "#6366F1");
      setLogoUrl(workspace.logoUrl || "");
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      formData.append("upload_preset", sig.uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: formData });
      const data = await res.json() as { secure_url: string };
      setLogoUrl(data.secure_url);
      toast({ title: "Logo uploaded" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Check Cloudinary configuration" });
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
