import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function DangerZone() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setError(null);
    setDeleting(true);
    try {
      const { response } = await api.DELETE("/me");
      if (response.status === 204) {
        navigate("/?deleted=1");
        return;
      }
      setError("Could not delete your account. Please try again or email us.");
    } catch {
      setError("Could not delete your account. Please try again or email us.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy &amp; data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-sm text-muted-foreground">
            Disconnect your Instagram account and permanently delete everything Loop stores about
            you — tokens, posts, comments, messages, and rules.
          </p>
          <Button variant="outline" onClick={() => setConfirming(true)}>
            <Trash2 className="size-4 text-destructive" />
            Delete account &amp; data
          </Button>
        </div>

        {confirming && (
          <Dialog open onOpenChange={(open) => !open && !deleting && setConfirming(false)}>
            <DialogContent className="max-w-md">
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your Instagram connection and access tokens, cached posts,
                comment history, DM history, and all automation rules. It cannot be undone.
              </DialogDescription>
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting…" : "Delete everything"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
