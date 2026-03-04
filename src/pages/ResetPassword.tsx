import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user arrived via a recovery link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      // Supabase auto-sets the session from the recovery link
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsValidSession(!!session);
        setChecking(false);
      });
    } else {
      // Also check if there's already a session (user may have been redirected)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsValidSession(!!session);
        setChecking(false);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success("Password updated successfully!");
        setTimeout(() => navigate("/portal"), 2000);
      }
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-secondary mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground mb-4">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button variant="accent" onClick={() => navigate("/portal")}>
              Back to Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border text-center">
            <CheckCircle className="h-12 w-12 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-bold text-secondary mb-2">Password Updated</h2>
            <p className="text-muted-foreground mb-4">
              Your password has been reset successfully. Redirecting to portal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 pt-20 md:pt-24 pb-8">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-border">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary mb-2">Reset Your Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-foreground">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm new password"
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button variant="accent" size="lg" className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
