-- RPC function: verify student for activation
CREATE OR REPLACE FUNCTION public.verify_student_for_activation(
  p_student_number TEXT,
  p_last_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
BEGIN
  SELECT id, first_name, last_name, email, student_number, status, user_id
  INTO v_student
  FROM public.students
  WHERE student_number = UPPER(TRIM(p_student_number))
    AND LOWER(TRIM(last_name)) = LOWER(TRIM(p_last_name))
    AND status = 'pending'
    AND account_type = 'student'
  LIMIT 1;

  IF NOT FOUND OR v_student.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'student_id', v_student.id,
    'email', COALESCE(v_student.email, ''),
    'first_name', v_student.first_name,
    'last_name', v_student.last_name
  );
END;
$$;

-- RPC function: link student account after signup
CREATE OR REPLACE FUNCTION public.link_student_account(
  p_student_id UUID,
  p_user_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Verify student exists and is pending
  SELECT id, status, user_id INTO v_student
  FROM public.students
  WHERE id = p_student_id AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found');
  END IF;

  IF v_student.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already activated');
  END IF;

  UPDATE public.students
  SET user_id = p_user_id,
      status = 'active',
      active = true,
      email = LOWER(TRIM(p_email))
  WHERE id = p_student_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC function: login with student ID (lookup email for student)
CREATE OR REPLACE FUNCTION public.get_student_email_for_login(
  p_student_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
BEGIN
  SELECT s.email, s.status, u.email as auth_email
  INTO v_student
  FROM public.students s
  LEFT JOIN auth.users u ON u.id = s.user_id
  WHERE s.student_number = UPPER(TRIM(p_student_number))
    AND s.status = 'active'
    AND s.user_id IS NOT NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'email', COALESCE(v_student.auth_email, v_student.email)
  );
END;
$$;
