"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex";
import type { Id } from "@repo/convex/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/app/components/Skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Copy, AlertCircle, X, RefreshCw } from "lucide-react";
import { getDisplayMessage } from "@/lib/errors";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export function ApiKeysSection() {
  const apiKeys = useQuery(api.apiKeys.listApiKeys);
  const generateApiKey = useMutation(api.apiKeys.generateApiKey);
  const rotateApiKey = useMutation(api.apiKeys.rotateApiKey);
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey);
  const deleteApiKey = useMutation(api.apiKeys.deleteApiKey);
  const completePairing = useMutation(api.devicePairing.completePairing);

  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [confirmRotateKey, setConfirmRotateKey] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [pairingDeviceName, setPairingDeviceName] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState<string | null>(null);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setError(null);
    setIsCreating(true);

    try {
      const result = await generateApiKey({ name: newKeyName.trim() });
      setShowNewKey(result.fullKey);
      setNewKeyName("");
    } catch (err) {
      setError(getDisplayMessage(err) || "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompletePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;

    setError(null);
    setPairingSuccess(null);
    setIsPairing(true);
    try {
      const result = await completePairing({
        pairingCode: pairingCode.trim().toUpperCase(),
        deviceName: pairingDeviceName.trim() || undefined,
      });
      setPairingSuccess(
        `Display paired (${result.pairingCode}). The display will receive key ${result.keyPrefix}...`
      );
      setPairingCode("");
      setPairingDeviceName("");
    } catch (err) {
      setError(getDisplayMessage(err) || "Failed to pair display device");
    } finally {
      setIsPairing(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeApiKey({ keyId: keyId as Id<"apiKeys"> });
    } catch (err) {
      setError(getDisplayMessage(err) || "Failed to revoke API key");
    }
  };

  const handleRotate = (keyId: string) => {
    setConfirmRotateKey(keyId);
  };

  const executeRotateKey = async () => {
    if (!confirmRotateKey) return;
    setIsRotating(true);
    try {
      const result = await rotateApiKey({ keyId: confirmRotateKey as Id<"apiKeys"> });
      setShowNewKey(result.fullKey);
    } catch (err) {
      setError(getDisplayMessage(err) || "Failed to rotate API key");
    }
    setIsRotating(false);
    setConfirmRotateKey(null);
  };

  const handleDelete = (keyId: string) => {
    setConfirmDeleteKey(keyId);
  };

  const executeDeleteKey = async () => {
    if (!confirmDeleteKey) return;
    try {
      await deleteApiKey({ keyId: confirmDeleteKey as Id<"apiKeys"> });
    } catch (err) {
      setError(getDisplayMessage(err) || "Failed to delete API key");
    }
    setConfirmDeleteKey(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <p className="text-small text-muted-foreground">
            Use API keys to access your tournament data programmatically
          </p>
        </CardHeader>
        <CardContent>
          {/* New key created alert */}
          {showNewKey && (
            <Alert className="mb-6 border-success/35 bg-success-light">
              <div className="col-start-2 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-success">New API key ready!</p>
                    <AlertDescription className="text-success">
                      Make sure to copy your API key now. You won&apos;t be able to see it again!
                    </AlertDescription>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowNewKey(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="w-full min-w-0 flex-1 break-all rounded-lg bg-secondary px-3 py-2 text-small font-mono text-foreground">
                    {showNewKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => copyToClipboard(showNewKey)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Pair display device */}
          <div className="mb-6 rounded-lg border border-border p-4">
            <p className="mb-1 font-medium">Pair Display Device</p>
            <p className="mb-4 text-small text-muted-foreground">
              Enter the 6-character code shown in the desktop display app.
            </p>
            {pairingSuccess && (
              <Alert className="mb-4 border-success/35 bg-success-light">
                <AlertDescription className="text-success">{pairingSuccess}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCompletePairing} className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                placeholder="Pairing code (e.g., A1B2C3)"
                className="sm:max-w-[180px] uppercase"
                maxLength={6}
              />
              <Input
                type="text"
                value={pairingDeviceName}
                onChange={(e) => setPairingDeviceName(e.target.value)}
                placeholder="Device name (optional)"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isPairing || pairingCode.trim().length < 6}
                variant="brand"
              >
                {isPairing ? "Pairing..." : "Pair Device"}
              </Button>
            </form>
          </div>

          {/* Create new key */}
          <form onSubmit={handleCreateKey} className="flex gap-3 mb-6">
            <Input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production)"
              className="flex-1"
            />
            <Button type="submit" disabled={isCreating || !newKeyName.trim()} variant="brand">
              {isCreating ? "Creating..." : "Create Key"}
            </Button>
          </form>

          {/* Existing keys */}
          {apiKeys === undefined ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-secondary rounded-lg">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key._id}
                  className={`p-4 bg-secondary rounded-lg ${!key.isActive ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{key.name}</span>
                        {!key.isActive && <Badge variant="muted">Revoked</Badge>}
                      </div>
                      <code className="text-small text-muted-foreground font-mono">
                        {key.keyPrefix}...
                      </code>
                      <p className="text-small text-muted-foreground mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt &&
                          ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {key.isActive && (
                        <>
                          <Button onClick={() => handleRotate(key._id)} variant="outline" size="sm">
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            Rotate
                          </Button>
                          <Button
                            onClick={() => handleRevoke(key._id)}
                            variant="outline"
                            size="sm"
                            className="text-brand-hover border-brand hover:bg-brand-light dark:text-brand dark:border-brand dark:hover:bg-brand-light"
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => handleDelete(key._id)}
                        variant="outline"
                        size="sm"
                        className="text-error border-error/35 hover:bg-error/12"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmDeleteKey !== null}
        onConfirm={executeDeleteKey}
        onCancel={() => setConfirmDeleteKey(null)}
        title="Delete API Key"
        description="Are you sure you want to delete this API key? Any applications using it will lose access."
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmDialog
        open={confirmRotateKey !== null}
        onConfirm={executeRotateKey}
        onCancel={() => setConfirmRotateKey(null)}
        title="Rotate API Key"
        description="This will generate a new key and immediately invalidate the old one. Any applications using the current key will need to be updated."
        confirmLabel={isRotating ? "Rotating..." : "Rotate Key"}
        variant="danger"
      />
    </>
  );
}
