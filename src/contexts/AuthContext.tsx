import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  isStudent: boolean;
  isParent: boolean;
  studentProfile: StudentProfile | null;
  linkedStudentProfile: StudentProfile | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [linkedStudentProfile, setLinkedStudentProfile] = useState<StudentProfile | null>(null);
  const initialLoadRef = useRef(true);

  const checkRoles = async (userId: string) => {
    setIsAdminLoading(true);
    try {
      // Check admin role
      const { data: adminData, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminError) {
        console.error('Error checking admin role:', adminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!adminData);
      }

      // Check if this user is linked to a student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_number, account_type, linked_student_id, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (studentError) {
        console.error('Error checking student profile:', studentError);
        setIsStudent(false);
        setIsParent(false);
        setStudentProfile(null);
        setLinkedStudentProfile(null);
      } else if (studentData) {
        const isParentAccount = studentData.account_type === 'parent';
        const isActiveStudent = studentData.status === 'active' || (studentData.status == null && studentData.account_type === 'parent');
        setIsParent(isParentAccount && isActiveStudent);
        setIsStudent(!isParentAccount && isActiveStudent);
        setStudentProfile({
          id: studentData.id,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          student_number: studentData.student_number,
        });

        // If parent, fetch linked student profile
        if (isParentAccount && studentData.linked_student_id) {
          const { data: linkedData } = await supabase
            .from('students')
            .select('id, first_name, last_name, student_number')
            .eq('id', studentData.linked_student_id)
            .maybeSingle();
          setLinkedStudentProfile(linkedData || null);
        } else {
          setLinkedStudentProfile(null);
        }
      } else {
        setIsStudent(false);
        setIsParent(false);
        setStudentProfile(null);
        setLinkedStudentProfile(null);
      }
    } catch (err) {
      console.error('Error checking roles:', err);
      setIsAdmin(false);
      setIsStudent(false);
      setIsParent(false);
      setStudentProfile(null);
      setLinkedStudentProfile(null);
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (!initialLoadRef.current) {
          if (event === 'SIGNED_IN') {
            toast.success('Signed in successfully');
          } else if (event === 'SIGNED_OUT') {
            toast.info('You have been signed out');
          }
        }
        initialLoadRef.current = false;

        if (session?.user) {
          setTimeout(() => {
            checkRoles(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsStudent(false);
          setIsParent(false);
          setStudentProfile(null);
          setLinkedStudentProfile(null);
          setIsAdminLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkRoles(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/portal`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsStudent(false);
    setIsParent(false);
    setStudentProfile(null);
    setLinkedStudentProfile(null);
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    isAdminLoading,
    isStudent,
    isParent,
    studentProfile,
    linkedStudentProfile,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
