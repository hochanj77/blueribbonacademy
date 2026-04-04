import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Key, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

export default function UsersTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const currentUserEntry: AuthUser[] = user
    ? [
        {
          id: user.id,
          email: user.email || "",
          created_at: user.created_at || new Date().toISOString(),
          last_sign_in_at: user.last_sign_in_at || null,
          roles: ["admin"],
        },
      ]
    : [];

  // Query admin users from user_roles table
  const { data: fetchedUsers, isLoading } = useQuery<AuthUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "admin");
      if (error) throw error;
      return (roles || []).map((r) => ({
        id: r.user_id,
        email: r.user_id === user?.id ? (user?.email || "") : r.user_id,
        created_at: r.created_at,
        last_sign_in_at: r.user_id === user?.id ? (user?.last_sign_in_at || null) : null,
        roles: ["admin"],
      }));
    },
    retry: 1,
  });

  const users = fetchedUsers && fetchedUsers.length > 0 ? fetchedUsers : currentUserEntry;

  // Verify current password using a separate client to avoid triggering auth state changes
  const verifyCurrentPassword = async () => {
    if (!user?.email || !currentPassword) return;
    setVerifying(true);
    try {
      const verifyClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { error } = await verifyClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (error) {
        toast.error("Incorrect password");
        return;
      }
      setIsVerified(true);
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const closePasswordDialog = () => {
    setPasswordOpen(false);
    setIsVerified(false);
    setCurrentPassword("");
    setResetPassword("");
    setConfirmPassword("");
  };

  // Change own password using Supabase auth
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      closePasswordDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Create new admin — insert into auth + user_roles
  const createMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Sign up the new user
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Failed to create user");

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: "admin" });
      if (roleError) throw roleError;

      return data.user;
    },
    onSuccess: (newUser) => {
      toast.success(`Admin account created for ${newUser.email}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Admin Accounts
            {isLoading && <Loader2 className="inline h-4 w-4 animate-spin ml-2" />}
          </h2>
          <p className="text-sm text-muted-foreground">Manage admin authentication accounts and passwords</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Admin</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>Create a new administrator account with full access.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({ email: newEmail, password: newPassword });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Admin Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="border border-border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{u.email}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">admin</Badge>
                    <span className="text-xs text-muted-foreground">
                      Last sign in: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>

                {u.id === user?.id && (
                  <Dialog open={passwordOpen} onOpenChange={(open) => {
                    if (!open) closePasswordDialog();
                    else setPasswordOpen(true);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Key className="h-3.5 w-3.5" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          {!isVerified
                            ? "Enter your current password to verify your identity."
                            : "Set a new password for your account."}
                        </DialogDescription>
                      </DialogHeader>

                      {!isVerified ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            verifyCurrentPassword();
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                              placeholder="Enter your current password"
                            />
                          </div>
                          <Button type="submit" className="w-full gap-2" disabled={verifying}>
                            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                            Verify Identity
                          </Button>
                        </form>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (resetPassword !== confirmPassword) {
                              toast.error("Passwords do not match");
                              return;
                            }
                            updatePasswordMutation.mutate(resetPassword);
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                              type="password"
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                              required
                              minLength={6}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              minLength={6}
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={updatePasswordMutation.isPending}>
                            {updatePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Password
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
