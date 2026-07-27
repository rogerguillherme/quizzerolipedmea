GRANT SELECT ON public.leads TO authenticated;
CREATE POLICY admins_read_leads ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));