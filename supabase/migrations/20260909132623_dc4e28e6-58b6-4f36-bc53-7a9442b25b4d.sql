REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_manager() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.claim_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.submit_quotation(text,text,text,text,text,text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quotation(text,text,text,text,text,text,text,jsonb) TO anon, authenticated;