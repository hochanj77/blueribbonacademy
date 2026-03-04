-- Add status column to students table
ALTER TABLE public.students ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Migrate existing data
UPDATE public.students SET status = 'inactive' WHERE active = false;
UPDATE public.students SET status = 'active' WHERE user_id IS NOT NULL AND active = true;
UPDATE public.students SET status = 'pending' WHERE user_id IS NULL AND active = true;

-- Update the generate_student_number trigger to only fire when student_number is null
CREATE OR REPLACE FUNCTION public.generate_student_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
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
  FROM students
  WHERE student_number LIKE initials || '%';
  
  IF next_num < 100 THEN
    next_num := 100 + next_num;
  END IF;
  
  new_student_number := initials || next_num::TEXT;
  NEW.student_number := new_student_number;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_student_number ON public.students;
CREATE TRIGGER set_student_number
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_student_number();