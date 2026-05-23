import { useState, useEffect } from "react";
import { Loader2, Copy, Check, Globe, ExternalLink, CheckCircle2, XCircle, AlertCircle, Trash2 } from "lucide-react";
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

type DnsStatus = "idle" | "checking" | "verified" | "failed";

interface DnsResult {
  verified: boolean;
  reason?: string;
  cname?: string;
}

const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function isDomainValid(domain: string): boolean {
  const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return DOMAIN_REGEX.test(cleaned);
}

export function WorkspaceSettingsForm({ showBranding = true, showBrandingOnly = false }: WorkspaceSettingsFormProps) {
  const { data: workspace, isLoading } = useWorkspace();
  const updateWorkspace = useUpdateWorkspace();

  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [savedDomain, setSavedDomain] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<DnsStatus>("idle");
  const [dnsResult, setDnsResult] = useState<DnsResult | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setAgencyName(workspace.agencyName || "");
      setPrimaryColor(workspace.primaryColor || "#6366F1");
      setLogoUrl(workspace.logoUrl || "");
      setCustomDomain(workspace.customDomain || "");
      setSavedDomain(workspace.customDomain || null);
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

  const handleDomainChange = (val: string) => {
    setCustomDomain(val);
    setDnsStatus("idle");
    setDnsResult(null);
    if (val.trim() && !isDomainValid(val.trim())) {
      setDomainError("Enter a valid domain (e.g. portal.youragency.com)");
    } else {
      setDomainError(null);
    }
  };

  const handleSaveDomain = async () => {
    const trimmed = customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (trimmed && !isDomainValid(trimmed)) {
      setDomainError("Enter a valid domain (e.g. portal.youragency.com)");
      return;
    }
    setSavingDomain(true);
    setDnsStatus("idle");
    setDnsResult(null);
    try {
      await updateWorkspace.mutateAsync({ customDomain: trimmed || null });
      setSavedDomain(trimmed || null);
      setCustomDomain(trimmed);
      toast({ title: trimmed ? "Custom domain saved" : "Custom domain removed" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes("DOMAIN_TAKEN")) {
        toast({ variant: "destructive", title: "Domain already in use", description: "This domain is linked to another workspace." });
      } else {
        toast({ variant: "destructive", title: "Failed to save domain" });
      }
    } finally {
      setSavingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    setSavingDomain(true);
    setDnsStatus("idle");
    setDnsResult(null);
    try {
      await updateWorkspace.mutateAsync({ customDomain: null });
      setSavedDomain(null);
      setCustomDomain("");
      setDomainError(null);
      toast({ title: "Custom domain removed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to remove domain" });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDns = async () => {
    setDnsStatus("checking");
    setDnsResult(null);
    try {
      const res = await api.get("/api/workspace/verify-domain");
      const data = res.data as DnsResult;
      setDnsResult(data);
      setDnsStatus(data.verified ? "verified" : "failed");
    } catch {
      setDnsStatus("failed");
      setDnsResult({ verified: false, reason: "Could not reach the verification service. Please try again." });
    }
  };

  const handleCopySlug = () => {
    if (!workspace?.slug) return;
    navigator.clipboard.writeText(`https://shipdesk-delta.vercel.app/portal/${workspace.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const domainHasChanges = customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") !== (savedDomain || "");

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
              <Label>Portal URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={workspace?.slug ? `shipdesk-delta.vercel.app/portal/${workspace.slug}` : ""}
                  readOnly
                  className="font-mono bg-muted text-sm"
                  data-testid="input-portal-url"
                />
                <Button variant="outline" size="icon" onClick={handleCopySlug} className="flex-shrink-0" data-testid="button-copy-portal-url">
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
              <div className="flex gap-2">
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  placeholder="portal.youragency.com"
                  className={`font-mono text-sm flex-1 ${domainError ? "border-destructive" : ""}`}
                  data-testid="input-custom-domain"
                />
                {savedDomain && !domainHasChanges && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveDomain}
                    disabled={savingDomain}
                    title="Remove custom domain"
                    data-testid="button-remove-custom-domain"
                  >
                    {savingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                  </Button>
                )}
              </div>
              {domainError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {domainError}
                </p>
              )}
            </div>

            {savedDomain && (
              <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">DNS Setup Instructions</p>
                <p>Add a <span className="font-mono bg-background border rounded px-1">CNAME</span> record pointing your domain to:</p>
                <p className="font-mono bg-background border rounded px-2 py-1 select-all">
                  {workspace?.slug ? `shipdesk-delta.vercel.app/portal/${workspace.slug}` : "shipdesk-delta.vercel.app/portal/your-slug"}
                </p>
                <p className="flex items-center gap-1 mt-1">
                  DNS changes may take up to 48 hours to propagate.
                  <a
                    href="https://shipdesk-delta.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    Learn more <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            )}

            {!savedDomain && !customDomain && (
              <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">DNS Setup Instructions</p>
                <p>Add a <span className="font-mono bg-background border rounded px-1">CNAME</span> record pointing your domain to:</p>
                <p className="font-mono bg-background border rounded px-2 py-1 select-all">
                  {workspace?.slug ? `shipdesk-delta.vercel.app/portal/${workspace.slug}` : "shipdesk-delta.vercel.app/portal/your-slug"}
                </p>
                <p>DNS changes may take up to 48 hours to propagate.</p>
              </div>
            )}

            {dnsStatus !== "idle" && (
              <div className={`rounded-lg border p-3 text-xs space-y-1 ${
                dnsStatus === "checking" ? "bg-muted/50" :
                dnsStatus === "verified" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              }`}>
                {dnsStatus === "checking" && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking DNS records…
                  </p>
                )}
                {dnsStatus === "verified" && (
                  <p className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Domain verified! Your CNAME record is correctly configured.
                  </p>
                )}
                {dnsStatus === "failed" && dnsResult && (
                  <p className="flex items-start gap-1.5 text-red-700 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    {dnsResult.reason}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDomain}
                disabled={savingDomain || !!domainError || (!customDomain.trim() && !savedDomain && !domainHasChanges)}
                className="gap-1.5"
                data-testid="button-save-custom-domain"
              >
                {savingDomain ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Domain"}
              </Button>

              {savedDomain && !domainHasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyDns}
                  disabled={dnsStatus === "checking"}
                  className="gap-1.5"
                  data-testid="button-verify-dns"
                >
                  {dnsStatus === "checking" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking…</>
                  ) : dnsStatus === "verified" ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Re-check DNS</>
                  ) : (
                    "Check DNS"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSave}
        disabled={!name.trim() || updateWorkspace.isPending}
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
