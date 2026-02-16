create policy "Allow reading relatime users"
on "realtime"."messages" as permissive
to authenticated, postgres, service_role, supabase_realtime_admin
using (
  true
);

alter publication supabase_realtime
add table chat_message;
