import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    // 1. Check authentication
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw redirect({
        to: "/auth",
      });
    }

    // 2. Check administrator access
    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_admin" as never);

    if (adminError || !isAdmin) {
      // Make sure a non-admin cannot keep the session
      // and attempt to access the protected portal.
      await supabase.auth.signOut();

      throw redirect({
        to: "/auth",
      });
    }

    // 3. Both authentication and admin authorization passed
    return {
      user: data.user,
      isAdmin: true,
    };
  },

  component: () => <Outlet />,
});