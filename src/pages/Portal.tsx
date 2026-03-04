import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User, Loader2, AlertCircle, Users, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Portal() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isStudent, isParent, isAdminLoading, signIn } = useAuth();
  const { toast } = useToast();

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Activate Account state
  const [activateStudentId, setActivateStudentId] = useState("");
  const [activateLastName, setActivateLastName] = useState("");
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePassword, setActivatePassword] = useState("");
  const [activateConfirmPassword, setActivateConfirmPassword] = useState("");

  // Parent Sign Up state
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentStudentLastName, setParentStudentLastName] = useState("");
  const [parentStudentId, setParentStudentId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAdminLoading && user) {
      if (isAdmin) navigate("/admin");
      else if (isStudent) navigate("/dashboard");
      else if (isParent) navigate("/parent-dashboard");
    }
  }, [user, loading, isAdmin, isStudent, isParent, isAdminLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError("Invalid credentials.");
        toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid credentials." });
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

    if (activatePassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (activatePassword !== activateConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("activate-account", {
        body: {
          student_number: activateStudentId.trim(),
          last_name: activateLastName.trim(),
          email: activateEmail.trim(),
          password: activatePassword,
        },
      });

      if (response.error || response.data?.error) {
        const msg = response.data?.error || "Activation failed. Please try again.";
        setError(msg);
        toast({ variant: "destructive", title: "Activation Failed", description: msg });
      } else {
        setSuccess("Account activated! You can now sign in with your email and password.");
        toast({ title: "Account Activated", description: "You can now sign in." });
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

  const handleParentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!parentFirstName.trim() || !parentLastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!parentEmail || !parentPassword) {
      setError("Please enter your email and password.");
      return;
    }
    if (parentPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!parentStudentLastName.trim() || !parentStudentId.trim()) {
      setError("Please enter your child's last name and Student ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify the student exists and is active
      const { data: matchedStudent, error: matchErr } = await supabase
        .from("students")
        .select("id")
        .ilike("last_name", parentStudentLastName.trim())
        .eq("student_number", parentStudentId.trim().toUpperCase())
        .eq("status", "active")
        .eq("account_type", "student")
        .maybeSingle();

      if (matchErr || !matchedStudent) {
        setError("No active student found with that last name and Student ID. Your child must activate their account first.");
        setIsSubmitting(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/portal`;
      const { error } = await supabase.auth.signUp({
        email: parentEmail,
        password: parentPassword,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) {
        const errorMessage = error.message.includes("User already registered")
          ? "An account with this email already exists. Please sign in instead."
          : error.message || "Sign up failed.";
        setError(errorMessage);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("students").insert({
            first_name: parentFirstName.trim(),
            last_name: parentLastName.trim(),
            email: parentEmail,
            user_id: session.user.id,
            account_type: "parent",
            linked_student_id: matchedStudent.id,
            status: "active",
          });
        }
        setSuccess("Account created! Please check your email to verify your account before signing in.");
        toast({ title: "Account Created", description: "Check your email to verify." });
        setParentFirstName("");
        setParentLastName("");
        setParentEmail("");
        setParentPassword("");
        setParentStudentLastName("");
        setParentStudentId("");
      }
    } catch {
      setError("Sign up failed. Please check your connection and try again.");
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

  if (user && (isAdmin || isStudent || isParent)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !isAdmin && !isStudent && !isParent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-secondary mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground mb-4">
              Your account hasn't been linked to a student profile yet. Please contact PrepHaus administration.
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="activate">Activate</TabsTrigger>
              <TabsTrigger value="parent">Parent</TabsTrigger>
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
                  <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-foreground">Password</Label>
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
                    Enter the Student ID and last name provided by PrepHaus, then create your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activate-student-id" className="text-foreground">Student ID</Label>
                  <Input
                    id="activate-student-id"
                    type="text"
                    placeholder="e.g. JJ100"
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
                      placeholder="Create a password (min 6 chars)"
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

            {/* Parent Sign Up Tab */}
            <TabsContent value="parent">
              <form onSubmit={handleParentSignUp} className="space-y-5">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="parent-first-name" className="text-foreground">First Name</Label>
                    <Input
                      id="parent-first-name"
                      type="text"
                      placeholder="First name"
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-last-name" className="text-foreground">Last Name</Label>
                    <Input
                      id="parent-last-name"
                      type="text"
                      placeholder="Last name"
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-email" className="text-foreground">Your Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="parent-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="parent-password"
                      type="password"
                      placeholder="Create a password (min 6 chars)"
                      className="pl-10"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium text-secondary">Link to your child's account</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your child must activate their account first before you can sign up.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="parent-student-last-name" className="text-foreground">Child's Last Name</Label>
                    <Input
                      id="parent-student-last-name"
                      type="text"
                      placeholder="Enter child's last name"
                      value={parentStudentLastName}
                      onChange={(e) => setParentStudentLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-student-id" className="text-foreground">Child's Student ID</Label>
                    <Input
                      id="parent-student-id"
                      type="text"
                      placeholder="e.g. JJ100"
                      value={parentStudentId}
                      onChange={(e) => setParentStudentId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button variant="accent" size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Parent Account"
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
