import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Pencil, Key, Trash2, UserPlus, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

async function adminUsersAction(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function UsersTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AuthUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<AuthUser | null>(null);

  // Form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  // Password verification state
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { data: users = [], isLoading } = useQuery<AuthUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await adminUsersAction("list");
      return result.users || [];
    },
  });

  const verifyPassword = async (): Promise<boolean> => {
    setVerifying(true);
    try {
      await adminUsersAction("verify_password", { password: adminPassword });
      setIsVerified(true);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Incorrect password");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => adminUsersAction("create", { email: newEmail, password: newPassword, role: "admin" }),
    onSuccess: () => {
      toast.success(`Admin account created for ${newEmail}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateEmailMutation = useMutation({
    mutationFn: (params: { user_id: string; email: string }) => adminUsersAction("update_email", params),
    onSuccess: () => {
      toast.success("Email updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      closeEditDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (params: { user_id: string; password: string }) => adminUsersAction("update_password", params),
    onSuccess: () => {
      toast.success("Password updated");
      closePasswordDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (user_id: string) => adminUsersAction("delete", { user_id }),
    onSuccess: () => {
      toast.success("Admin deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeEditDialog = () => {
    setEditUser(null);
    setAdminPassword("");
    setIsVerified(false);
    setEditEmail("");
  };

  const closePasswordDialog = () => {
    setPasswordUser(null);
    setAdminPassword("");
    setIsVerified(false);
    setResetPassword("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Admin Accounts</h2>
          <p className="text-sm text-muted-foreground">Manage admin authentication accounts, emails, and passwords</p>
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
                createMutation.mutate();
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

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Edit Email - requires password verification */}
                  <Dialog
                    open={editUser?.id === u.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setEditUser(u);
                        setEditEmail(u.email);
                        setAdminPassword("");
                        setIsVerified(false);
                      } else {
                        closeEditDialog();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Email</DialogTitle>
                        <DialogDescription>
                          {!isVerified ? "Enter your admin password to proceed." : `Change email for ${u.email}`}
                        </DialogDescription>
                      </DialogHeader>

                      {!isVerified ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await verifyPassword();
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>Your Admin Password</Label>
                            <Input
                              type="password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              required
                              placeholder="Enter your password to verify"
                            />
                          </div>
                          <Button type="submit" className="w-full gap-2" disabled={verifying}>
                            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Verify Identity
                          </Button>
                        </form>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateEmailMutation.mutate({ user_id: u.id, email: editEmail });
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>New Email</Label>
                            <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                          </div>
                          <Button type="submit" className="w-full" disabled={updateEmailMutation.isPending}>
                            {updateEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Email
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Reset Password - requires password verification */}
                  <Dialog
                    open={passwordUser?.id === u.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setPasswordUser(u);
                        setResetPassword("");
                        setAdminPassword("");
                        setIsVerified(false);
                      } else {
                        closePasswordDialog();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Key className="h-3.5 w-3.5" />
                        Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password for {u.email}</DialogTitle>
                        <DialogDescription>
                          {!isVerified ? "Enter your admin password to proceed." : "Set a new password for this account."}
                        </DialogDescription>
                      </DialogHeader>

                      {!isVerified ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await verifyPassword();
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>Your Admin Password</Label>
                            <Input
                              type="password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              required
                              placeholder="Enter your password to verify"
                            />
                          </div>
                          <Button type="submit" className="w-full gap-2" disabled={verifying}>
                            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Verify Identity
                          </Button>
                        </form>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updatePasswordMutation.mutate({ user_id: u.id, password: resetPassword });
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} />
                          </div>
                          <Button type="submit" className="w-full" disabled={updatePasswordMutation.isPending}>
                            {updatePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Reset Password
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Delete - only show for non-self accounts */}
                  {u.email !== user?.email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete admin ${u.email}? This cannot be undone.`)) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
