import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User, Loader2, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Portal() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isStudent, isParent, isAdminLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState<"student" | "parent">("student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route logged-in users to the right place
  useEffect(() => {
    if (!loading && !isAdminLoading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else if (isStudent) {
        navigate("/dashboard");
      } else if (isParent) {
        navigate("/parent-dashboard");
      }
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
    } catch (err) {
      const errorMessage = "Sign in failed. Please check your connection and try again.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Connection Error", description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Parent-specific validation
    if (accountType === "parent") {
      if (!studentEmail.trim() || !studentId.trim()) {
        setError("Please enter your child's email and Student ID to link your account.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // If parent, verify the student exists before creating the account
      let linkedStudentId: string | null = null;
      if (accountType === "parent") {
        const { data: matchedStudent, error: matchErr } = await supabase
          .from("students")
          .select("id")
          .eq("email", studentEmail.trim())
          .eq("student_number", studentId.trim())
          .eq("active", true)
          .maybeSingle();

        if (matchErr || !matchedStudent) {
          setError("No active student found with that email and Student ID. Please check and try again.");
          setIsSubmitting(false);
          return;
        }
        linkedStudentId = matchedStudent.id;
      }

      const { error } = await signUp(email, password);

      if (error) {
        let errorMessage: string;
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else {
          errorMessage = error.message || 'Sign up failed. Please try again.';
        }
        setError(errorMessage);
        toast({ variant: "destructive", title: "Sign Up Failed", description: errorMessage });
      } else {
        // Create the record after signup
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('students').insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email,
            user_id: session.user.id,
            account_type: accountType,
            linked_student_id: linkedStudentId,
          });
        }
        const successMessage = 'Account created! Please check your email to verify your account before signing in.';
        setSuccess(successMessage);
        toast({ title: "Account Created", description: successMessage });
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setStudentEmail('');
        setStudentId('');
      }
    } catch (err) {
      const errorMessage = "Sign up failed. Please check your connection and try again.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Sign Up Failed", description: errorMessage });
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

  // User is logged in — redirect based on role
  if (user && (isAdmin || isStudent || isParent)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User is logged in but has no linked student/parent profile and is not admin
  if (user && !isAdmin && !isStudent && !isParent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-secondary mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground mb-4">
              Your account hasn't been linked to a student profile yet. Please contact PrepHaus administration to set up your access.
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

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

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

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5">
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

                {/* Account Type Toggle */}
                <div className="space-y-2">
                  <Label className="text-foreground">I am a...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAccountType("student")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        accountType === "student"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("parent")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        accountType === "parent"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Parent
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-first-name" className="text-foreground">First Name</Label>
                    <Input
                      id="signup-first-name"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-last-name" className="text-foreground">Last Name</Label>
                    <Input
                      id="signup-last-name"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
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
                  <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 chars)"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Parent linking fields */}
                {accountType === "parent" && (
                  <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/50">
                    <p className="text-sm font-medium text-secondary">Link to your child's account</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your child's email and Student ID to connect your account to their profile.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="student-email" className="text-foreground">Child's Email</Label>
                      <Input
                        id="student-email"
                        type="email"
                        placeholder="student@example.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required={accountType === "parent"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-id" className="text-foreground">Child's Student ID</Label>
                      <Input
                        id="student-id"
                        type="text"
                        placeholder="e.g. JJ100"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required={accountType === "parent"}
                      />
                    </div>
                  </div>
                )}

                <Button variant="accent" size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
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
