-- =============================================
-- CONSOLIDATED PRODUCTION SCHEMA
-- Blue Ribbon Academy — April 2026
-- Removes: tutors table, newsletter_subscribers
-- =============================================

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Role check (security definer to prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Parent linked-student lookup (security definer)
CREATE OR REPLACE FUNCTION public.get_linked_student_id_for_parent(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT linked_student_id
  FROM public.students
  WHERE user_id = _user_id
    AND account_type = 'parent'
    AND linked_student_id IS NOT NULL
  LIMIT 1
$$;

-- Student number auto-generation
CREATE OR REPLACE FUNCTION public.generate_student_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE
  initials TEXT;
  next_num INT;
  new_student_number TEXT;
BEGIN
  IF NEW.student_number IS NOT NULL AND NEW.student_number != '' THEN
    RETURN NEW;
  END IF;
  initials := UPPER(LEFT(NEW.first_name, 1) || LEFT(NEW.last_name, 1));
  SELECT COALESCE(MAX(
    CASE
      WHEN student_number ~ ('^' || initials || '[0-9]+$')
      THEN CAST(SUBSTRING(student_number FROM LENGTH(initials) + 1) AS INT)
      ELSE 0
    END
  ), 0) + 1 INTO next_num
  FROM students WHERE student_number LIKE initials || '%';
  IF next_num < 100 THEN next_num := 100 + next_num; END IF;
  new_student_number := initials || next_num::TEXT;
  NEW.student_number := new_student_number;
  RETURN NEW;
END;
$function$;

-- =============================================
-- 1. USER ROLES
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. COURSES
-- =============================================
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    price DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. STUDENTS
-- =============================================
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    student_number TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    grade_level TEXT,
    school TEXT,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending',
    account_type TEXT NOT NULL DEFAULT 'student',
    linked_student_id UUID REFERENCES public.students(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own student record" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents can view linked student" ON public.students
  FOR SELECT TO authenticated
  USING (id = public.get_linked_student_id_for_parent(auth.uid()));

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_student_number BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.generate_student_number();

CREATE INDEX idx_students_student_number ON public.students(student_number);
CREATE INDEX idx_students_user_id ON public.students(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;

-- =============================================
-- 4. STUDENT ENROLLMENTS
-- =============================================
CREATE TABLE public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    UNIQUE(student_id, course_id)
);
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage enrollments" ON public.student_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own enrollments" ON public.student_enrollments
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Parents can view linked student enrollments" ON public.student_enrollments
  FOR SELECT USING (
    student_id IN (
      SELECT s.linked_student_id FROM students s
      WHERE s.user_id = auth.uid() AND s.account_type = 'parent' AND s.linked_student_id IS NOT NULL
    )
  );

-- =============================================
-- 5. CLASS SCHEDULES
-- =============================================
CREATE TABLE public.class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedules" ON public.class_schedules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.class_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. ATTENDANCE (kept for future use)
-- =============================================
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    schedule_id UUID REFERENCES public.class_schedules(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, schedule_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7. PROGRESS NOTES
-- =============================================
CREATE TABLE public.progress_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage progress notes" ON public.progress_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_progress_notes_updated_at BEFORE UPDATE ON public.progress_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 8. ANNOUNCEMENTS
-- =============================================
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'parents')),
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view published announcements" ON public.announcements
  FOR SELECT USING (published = true);

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. REPORT CARDS
-- =============================================
CREATE TABLE public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    term TEXT,
    year INTEGER,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage report cards" ON public.report_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own report cards" ON public.report_cards
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Parents can view linked student report cards" ON public.report_cards
  FOR SELECT USING (
    student_id IN (
      SELECT s.linked_student_id FROM students s
      WHERE s.user_id = auth.uid() AND s.account_type = 'parent' AND s.linked_student_id IS NOT NULL
    )
  );

-- =============================================
-- 10. STUDENT GRADES
-- =============================================
CREATE TABLE public.student_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_name TEXT NOT NULL,
    semester TEXT NOT NULL,
    attitude TEXT,
    homework TEXT,
    participation TEXT,
    test_quiz TEXT,
    comments TEXT,
    imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    import_batch_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage grades" ON public.student_grades
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own grades" ON public.student_grades
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Parents can view linked student grades" ON public.student_grades
  FOR SELECT USING (
    student_id IN (
      SELECT s.linked_student_id FROM students s
      WHERE s.user_id = auth.uid() AND s.account_type = 'parent' AND s.linked_student_id IS NOT NULL
    )
  );

CREATE TRIGGER update_student_grades_updated_at BEFORE UPDATE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 11. CATALOG REQUESTS
-- =============================================
CREATE TABLE public.catalog_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    preferred_language TEXT,
    preferred_location TEXT,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit catalog request" ON public.catalog_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view catalog requests" ON public.catalog_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 12. SITE CONTENT (CMS)
-- =============================================
CREATE TABLE public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page TEXT NOT NULL,
    section_key TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(page, section_key)
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed CMS content
INSERT INTO public.site_content (page, section_key, content) VALUES
  ('home', 'hero', '{"headline":"Where Every Student Can Shine.","subheading":"We believe all students have the right to receive a good education. With over 20 years of experience, we strive to help students develop character alongside academic prowess every step of the way.","cta_primary_text":"View Programs","cta_primary_link":"/college-consulting","cta_secondary_text":"Download Course Catalog","cta_secondary_link":"/catalog"}'),
  ('home', 'cta_section', '{"headline":"Ready to Start Your Journey?","subheading":"Contact us today and learn how Blue Ribbon Academy can help you achieve your academic goals.","button_text":"Contact Us","button_link":"/contact"}'),
  ('courses', 'hero', '{"headline":"Our Programs","subheading":"Explore our comprehensive range of test preparation programs and academic tutoring services designed to help every student succeed."}'),
  ('courses', 'cta', '{"text":"Reach out and we''ll help you find the perfect program for your needs.","button_text":"Download Course Catalog","button_link":"/catalog"}'),
  ('about', 'welcome', '{"headline":"Welcome to Blue Ribbon Academy","intro":"Blue Ribbon Academy was built on a simple belief: students learn best in community.","body":"What sets Blue Ribbon Academy apart is our focus on community. We believe that curiosity thrives when students feel secure. You aren''t just a number on a diagnostic test, but an individual with a story. We''ve cultivated a space where students are encouraged to ask questions, take risks, support one another, and grow together. With 20+ years of expertise, we know that the best results come when a student feels seen and supported."}'),
  ('about', 'belonging', '{"headline":"The Power of Belonging","body":"Our name is our philosophy. We''ve traded the cold, assembly-line feel of traditional test prep for a warm, welcoming environment—a place where students feel at home with teachers who genuinely know them, believe in them, and challenge them to grow."}'),
  ('about', 'heart', '{"headline":"The Heart Behind the Knowledge","body":"While many see education as a transactional transfer of facts, we strive to be more than mere vessels for knowledge. We believe education is not the end goal, but the vital process that helps students reach their dreams. Our teachers are mentors who care deeply, not just for your score growth, but for your personal potential.","values_intro":"At Blue Ribbon Academy, we work intentionally, every step of the way, to help students develop:"}'),
  ('about', 'excellence', '{"headline":"Built for Excellence. Anchored in Community.","body":"We never mistake warmth for weakness. We are uncompromising when it comes to academic rigor. Our standards are elite, and we never sacrifice performance for comfort. Instead, we use our community as the fuel for high achievement, believing that students reach their peak when they are challenged within a place they truly belong.","quote":"We are a community growing together, leaving no regrets as we build the academic prowess and inner grit needed for a secure future. We don''t just help you reach a goal; we give you the momentum to surpass it."}'),
  ('global', 'contact_info', '{"address_line1":"41 Union Ave FL2","address_line2":"Cresskill, NJ 07626","phone":"+1.201.406.3929","email":"info@blueribbon-nj.com","hours_weekday":"Mon-Fri: 3:30pm - 9:00pm","hours_weekend":"Sat: 9:00am - 4:00pm"}'),
  ('global', 'social_links', '{"instagram_url":"https://www.instagram.com/blueribbonacademy","instagram_handle":"@blueribbonacademy","google_business_url":"https://maps.app.goo.gl/LN2h5hTFhrknZ3SN8","google_business_name":"Blue Ribbon Academy"}'),
  ('global', 'catalog', '{"catalog_url":"","catalog_type":"link","catalog_description":"Fill out the form below and we''ll send you our complete course catalog."}')
ON CONFLICT (page, section_key) DO NOTHING;

-- =============================================
-- 13. MESSAGES
-- =============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    recipient_id UUID,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- 14. RESOURCES
-- =============================================
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read resources" ON public.resources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert resources" ON public.resources
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update resources" ON public.resources
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete resources" ON public.resources
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 15. CONTACT SUBMISSIONS
-- =============================================
CREATE TABLE public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    grade TEXT,
    subjects TEXT[],
    message TEXT NOT NULL,
    wants_catalog BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete contact submissions" ON public.contact_submissions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 16. ANALYTICS EVENTS
-- =============================================
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    page TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can insert events
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Only admins can read analytics
CREATE POLICY "Admins can read analytics" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at);

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Report cards (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('report-cards', 'report-cards', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can manage report card files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'report-cards' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'report-cards' AND public.has_role(auth.uid(), 'admin'));

-- Catalog (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog', 'catalog', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Catalog files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'catalog');
CREATE POLICY "Admins can upload catalog files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update catalog files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete catalog files" ON storage.objects
  FOR DELETE USING (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Resources (public read, admin write)
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read resource files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'resources');
CREATE POLICY "Admins can upload resource files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete resource files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));
