
-- Create resources table for admin-uploaded documents visible on student dashboard
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

-- Anyone authenticated can read resources
CREATE POLICY "Authenticated users can read resources"
ON public.resources FOR SELECT TO authenticated
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert resources"
ON public.resources FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resources"
ON public.resources FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resources"
ON public.resources FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Storage policies
CREATE POLICY "Authenticated users can read resource files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resource files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resource files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));
