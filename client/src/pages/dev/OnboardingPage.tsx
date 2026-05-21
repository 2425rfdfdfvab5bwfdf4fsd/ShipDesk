import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace, useCheckSubdomain } from "@/hooks/useWorkspace";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366F1", "#8B5CF6", "#0EA5E9", "#10B981",
  "#F59E0B", "#F43F5E", "#475569", "#18181B",
];

export function OnboardingPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [slugChecked, setSlugChecked] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [customColor, setCustomColor] = useState("#6366F1");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const createWorkspace = useCreateWorkspace();
  const { data: subdomainData } = useCheckSubdomain(slugChecked ? slug : "");

  const slugAvailable = !slugChecked || subdomainData?.available !== false;

  const handleLogoUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 2 MB" });
      return;
    }
    setUploadingLogo(true);
    try {
      const sigResp = await api.get("/api/workspace/logo-upload-signature");
      const sig = sigResp.data;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", sig.timestamp);
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      formData.append("upload_preset", sig.uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as { secure_url: string };
      setLogoUrl(data.secure_url);
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Please try again" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createWorkspace.mutateAsync({
        name,
        slug: slug.toLowerCase(),
        agencyName: agencyName || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast({
        variant: "destructive",
        title: "Failed to create workspace",
        description: errData?.error === "SLUG_TAKEN" ? "That subdomain is already taken" : "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold">Set up ShipDesk</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Step {step} of 2
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-semibold text-lg mb-0.5">Your workspace</h2>
                  <p className="text-sm text-muted-foreground">Set up your workspace details.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex's Dev Studio"
                    maxLength={60}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency">Agency Name (optional)</Label>
                  <Input
                    id="agency"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Chen Digital"
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground">Shown to clients in their portal</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Portal Subdomain *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    onBlur={() => slug.length >= 3 && setSlugChecked(true)}
                    placeholder="alexchen"
                    minLength={3}
                    maxLength={30}
                  />
                  {slug && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {slug}.portal.shipdesk.io
                    </p>
                  )}
                  {slugChecked && subdomainData?.available === false && (
                    <p className="text-xs text-destructive">This subdomain is already taken</p>
                  )}
                  {slugChecked && subdomainData?.available === true && (
                    <p className="text-xs text-green-600">✓ Available</p>
                  )}
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => setStep(2)}
                  disabled={!name || slug.length < 3 || subdomainData?.available === false}
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-semibold text-lg mb-0.5">Brand your portal</h2>
                  <p className="text-sm text-muted-foreground">Add your logo and choose a brand color. Both are optional.</p>
                </div>

                <div className="space-y-2">
                  <Label>Logo (optional)</Label>
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded border" />
                    )}
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" disabled={uploadingLogo} type="button" asChild>
                        <span>
                          {uploadingLogo ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</>
                          ) : (
                            logoUrl ? "Change logo" : "Upload logo"
                          )}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or SVG · Max 2 MB</p>
                </div>

                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-md border-2 transition-transform",
                          primaryColor === color ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => { setPrimaryColor(color); setCustomColor(color); }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      onBlur={() => {
                        if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
                          setPrimaryColor(customColor);
                        } else {
                          setCustomColor(primaryColor);
                        }
                      }}
                      placeholder="#6366F1"
                      className="w-32 font-mono text-sm"
                    />
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleCreate}
                    disabled={createWorkspace.isPending}
                  >
                    {createWorkspace.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                    ) : (
                      "Create Workspace"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
