-- Add admin-only RLS policies for user_roles table to prevent privilege escalation
-- Regular users should NEVER be able to modify roles

-- Create policy to prevent INSERT by anyone (only service role can insert)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create policy to prevent UPDATE by anyone except admins
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create policy to prevent DELETE by anyone except admins
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));