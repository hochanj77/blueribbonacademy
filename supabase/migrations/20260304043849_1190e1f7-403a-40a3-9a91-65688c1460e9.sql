-- Create a security definer function to get linked student ID for parent
CREATE OR REPLACE FUNCTION public.get_linked_student_id_for_parent(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT linked_student_id
  FROM public.students
  WHERE user_id = _user_id
    AND account_type = 'parent'
    AND linked_student_id IS NOT NULL
  LIMIT 1
$$;

-- Drop the old recursive policy
DROP POLICY IF EXISTS "Parents can view linked student" ON public.students;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Parents can view linked student"
ON public.students
FOR SELECT
TO authenticated
USING (id = public.get_linked_student_id_for_parent(auth.uid()));