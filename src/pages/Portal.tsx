import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edgeFunction";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { toast } from "sonner";

export default function Portal() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isStudent, isAdminLoading, signIn } = useAuth();

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Activate Account state
  const [activateStudentId, setActivateStudentId] = useState("");
  const [activateLastName, setActivateLastName] = useState("");
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePassword, setActivatePassword] = useState("");
  const [activateConfirmPassword, setActivateConfirmPassword] = useState("");

  const { track } = useAnalytics();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleForgotPassword = async () => {
    if (!resetEmail) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent! Check your email.");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch {
      toast.error("Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAdminLoading && user) {
      if (isAdmin) navigate("/admin");
      else if (isStudent) navigate("/dashboard");
    }
  }, [user, loading, isAdmin, isStudent, isAdminLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginIdentifier || !password) {
      setError("Please enter your Email or Student ID and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isStudentId = /^[A-Za-z]{2}\d+$/.test(loginIdentifier.trim());

      if (isStudentId) {
        const { data, error: fnError } = await invokeEdgeFunction("login-with-student-id", {
          student_number: loginIdentifier.trim(),
          password,
        }, { requireAuth: false });

        if (fnError || data?.error) {
          const msg = data?.error || fnError?.message || "Invalid credentials.";
          setError(msg);
          toast.error(msg);
          return;
        }

        if (data?.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
      } else {
        const { error } = await signIn(loginIdentifier.trim(), password);
        if (error) {
          setError("Invalid credentials.");
          toast.error("Invalid credentials.");
        }
      }
    } catch {
      setError("Sign in failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!activateStudentId.trim() || !activateLastName.trim() || !activateEmail.trim() || !activatePassword) {
      setError("Please fill in all fields.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(activatePassword)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
      return;
    }

    if (activatePassword !== activateConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: response, error: fnError } = await invokeEdgeFunction("activate-account", {
        student_number: activateStudentId.trim(),
        last_name: activateLastName.trim(),
        email: activateEmail.trim(),
        password: activatePassword,
      }, { requireAuth: false });

      if (fnError || response?.error) {
        const msg = response?.error || fnError?.message || "Activation failed. Please try again.";
        setError(msg);
        toast.error(msg);
      } else {
        track('signup');
        setSuccess("Account activated! You can now sign in with your email and password.");
        toast.success("Account activated! You can now sign in.");
        setActivateStudentId("");
        setActivateLastName("");
        setActivateEmail("");
        setActivatePassword("");
        setActivateConfirmPassword("");
      }
    } catch {
      setError("Activation failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && (isAdmin || isStudent)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !isAdmin && !isStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-secondary mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground mb-4">
              Your account hasn't been linked to a student profile yet. Please contact Blue Ribbon Academy administration.
            </p>
            <Button variant="outline" onClick={() => navigate("/contact")}>
              Contact Us
            </Button>
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
            <h1 className="text-3xl font-bold text-secondary mb-2">
              Portal <span className="text-accent">Login</span>
            </h1>
            <p className="text-muted-foreground">
              Access your grades, resources, and reports
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full" onValueChange={() => { setError(null); setSuccess(null); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="activate">Activate</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signin-identifier" className="text-foreground">Email or Student ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signin-identifier"
                      type="text"
                      placeholder="Enter your email or Student ID"
                      className="pl-10"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-accent hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {showForgotPassword && (
                  <div className="p-4 rounded-lg border border-border bg-muted/50 space-y-3">
                    <p className="text-sm font-medium text-secondary">Reset Your Password</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="accent"
                        size="sm"
                        disabled={isSubmitting || !resetEmail}
                        onClick={handleForgotPassword}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <Button variant="accent" size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Activate Account Tab */}
            <TabsContent value="activate">
              <form onSubmit={handleActivateAccount} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-accent bg-accent/10">
                    <AlertDescription className="text-foreground">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="p-4 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium text-secondary">Activate Your Student Account</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the Student ID and last name provided by Blue Ribbon Academy, then create your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activate-student-id" className="text-foreground">Student ID</Label>
                  <Input
                    id="activate-student-id"
                    type="text"
                    placeholder="Enter your Student ID"
                    value={activateStudentId}
                    onChange={(e) => setActivateStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activate-last-name" className="text-foreground">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="activate-last-name"
                      type="text"
                      placeholder="Enter your last name"
                      className="pl-10"
                      value={activateLastName}
                      onChange={(e) => setActivateLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activate-email" className="text-foreground">Your Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="activate-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={activateEmail}
                      onChange={(e) => setActivateEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activate-password" className="text-foreground">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="activate-password"
                      type="password"
                      placeholder="Min 8 chars: upper, lower, number, special"
                      className="pl-10"
                      value={activatePassword}
                      onChange={(e) => setActivatePassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activate-confirm-password" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="activate-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      value={activateConfirmPassword}
                      onChange={(e) => setActivateConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button variant="accent" size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    "Activate Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
