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
  studentProfile: StudentProfile | null;
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
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
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
        .select('id, first_name, last_name, student_number, account_type, status')
        .eq('user_id', userId)
        .eq('account_type', 'student')
        .maybeSingle();

      if (studentError) {
        console.error('Error checking student profile:', studentError);
        setIsStudent(false);
        setStudentProfile(null);
      } else if (studentData) {
        const isActiveStudent = studentData.status === 'active';
        setIsStudent(isActiveStudent);
        setStudentProfile({
          id: studentData.id,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          student_number: studentData.student_number,
        });
      } else {
        setIsStudent(false);
        setStudentProfile(null);
      }
    } catch (err) {
      console.error('Error checking roles:', err);
      setIsAdmin(false);
      setIsStudent(false);
      setStudentProfile(null);
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const { data } = supabase.auth.onAuthStateChange(
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
            setStudentProfile(null);
            setIsAdminLoading(false);
          }
        }
      );
      subscription = data.subscription;
    } catch (err) {
      console.warn('Supabase auth listener failed (backend may be unavailable):', err);
      setLoading(false);
      setIsAdminLoading(false);
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          checkRoles(session.user.id);
        }
      })
      .catch((err) => {
        console.warn('Supabase getSession failed (backend may be unavailable):', err);
        setLoading(false);
        setIsAdminLoading(false);
      });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsStudent(false);
    setStudentProfile(null);
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    isAdminLoading,
    isStudent,
    studentProfile,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
