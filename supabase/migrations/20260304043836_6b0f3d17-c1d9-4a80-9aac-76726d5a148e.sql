-- Add admin role for new Prephaus.admin account
INSERT INTO public.user_roles (user_id, role)
VALUES ('8156f7b8-47bf-4cc7-93f7-efd2299c5205', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;