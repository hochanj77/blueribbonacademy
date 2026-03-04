import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, GraduationCap, Globe } from 'lucide-react';
import StudentsTab from '@/components/admin/StudentsTab';
import GradesTab from '@/components/admin/GradesTab';
import SiteContentTab from '@/components/admin/SiteContentTab';

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
    <div className="container px-4 pt-20 md:pt-24 pb-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Manage students, grades, content, and communications</p>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid lg:grid-cols-3">
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Grades</span>
          </TabsTrigger>
          <TabsTrigger value="website" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Website</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>

        <TabsContent value="grades">
          <GradesTab />
        </TabsContent>

        <TabsContent value="website">
          <SiteContentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;

