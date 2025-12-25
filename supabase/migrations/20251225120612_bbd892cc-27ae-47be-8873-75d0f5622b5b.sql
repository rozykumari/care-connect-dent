-- Allow doctors to add prescriptions/procedures even when a patient is not linked to a login

-- 1) patient_prescriptions: add patient_id and make user_id optional
ALTER TABLE public.patient_prescriptions
  ADD COLUMN IF NOT EXISTS patient_id uuid;

ALTER TABLE public.patient_prescriptions
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_prescriptions_patient_id_fkey'
  ) THEN
    ALTER TABLE public.patient_prescriptions
      ADD CONSTRAINT patient_prescriptions_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_prescriptions_user_or_patient_chk'
  ) THEN
    ALTER TABLE public.patient_prescriptions
      ADD CONSTRAINT patient_prescriptions_user_or_patient_chk
      CHECK (user_id IS NOT NULL OR patient_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_patient_id ON public.patient_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_user_id ON public.patient_prescriptions(user_id);

-- 2) patient_procedures: add patient_id and make user_id optional (keeps behavior consistent)
ALTER TABLE public.patient_procedures
  ADD COLUMN IF NOT EXISTS patient_id uuid;

ALTER TABLE public.patient_procedures
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_procedures_patient_id_fkey'
  ) THEN
    ALTER TABLE public.patient_procedures
      ADD CONSTRAINT patient_procedures_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_procedures_user_or_patient_chk'
  ) THEN
    ALTER TABLE public.patient_procedures
      ADD CONSTRAINT patient_procedures_user_or_patient_chk
      CHECK (user_id IS NOT NULL OR patient_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patient_procedures_patient_id ON public.patient_procedures(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_procedures_user_id ON public.patient_procedures(user_id);
