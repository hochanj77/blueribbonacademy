import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, GraduationCap, Globe, UserCog, BarChart3, Mail } from 'lucide-react';
import StudentsTab from '@/components/admin/StudentsTab';
import GradesTab from '@/components/admin/GradesTab';
import SiteContentTab from '@/components/admin/SiteContentTab';
import UsersTab from '@/components/admin/UsersTab';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import ContactsTab from '@/components/admin/ContactsTab';

const Admin = () => {
  const { user, loading, isAdmin, isAdminLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !isAdminLoading && user && !isAdmin) {
      navigate('/');
    }
  }, [user, loading, isAdmin, isAdminLoading, navigate]);

  if (loading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container px-3 sm:px-4 pt-20 md:pt-24 pb-6 md:pb-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">Manage students, grades, content, and communications</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="analytics" className="gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="website" className="gap-1.5 sm:gap-2 text-xs sm:text-sm py-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Website</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>

        <TabsContent value="grades">
          <GradesTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>

        <TabsContent value="website">
          <SiteContentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
