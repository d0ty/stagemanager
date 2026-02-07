-- Enable RLS on all tables
alter table role enable row level security;
alter table staff enable row level security;
alter table program enable row level security;
alter table crew_member enable row level security;
alter table program_file enable row level security;
alter table rehearsal enable row level security;
alter table task enable row level security;
alter table chat_message enable row level security;
alter table chat_mentions enable row level security;
alter table equipment_type enable row level security;
alter table equipment_item enable row level security;
alter table equipment_loan enable row level security;
alter table equipment_loan_item enable row level security;

-- role: full access for authenticated (admin role check can be added later)
create policy "role_all" on role for all to authenticated using (true) with check (true);

-- staff: authenticated users can read; staff can read own row
create policy "staff_select" on staff for select to authenticated using (true);
create policy "staff_insert" on staff for insert to authenticated with check (true);
create policy "staff_update" on staff for update to authenticated using (true);
create policy "staff_delete" on staff for delete to authenticated using (true);

-- program
create policy "program_select" on program for select to authenticated using (true);
create policy "program_all" on program for all to authenticated using (true) with check (true);

-- crew_member
create policy "crew_member_select" on crew_member for select to authenticated using (true);
create policy "crew_member_all" on crew_member for all to authenticated using (true) with check (true);

-- program_file
create policy "program_file_select" on program_file for select to authenticated using (true);
create policy "program_file_all" on program_file for all to authenticated using (true) with check (true);

-- rehearsal
create policy "rehearsal_select" on rehearsal for select to authenticated using (true);
create policy "rehearsal_all" on rehearsal for all to authenticated using (true) with check (true);

-- task
create policy "task_select" on task for select to authenticated using (true);
create policy "task_all" on task for all to authenticated using (true) with check (true);

-- chat_message: users can read all, insert own, update/delete own
create policy "chat_message_select" on chat_message for select to authenticated using (true);
create policy "chat_message_insert" on chat_message for insert to authenticated with check (auth.uid() = sender);
create policy "chat_message_update" on chat_message for update to authenticated using (auth.uid() = sender);
create policy "chat_message_delete" on chat_message for delete to authenticated using (auth.uid() = sender);

-- chat_mentions
create policy "chat_mentions_select" on chat_mentions for select to authenticated using (true);
create policy "chat_mentions_all" on chat_mentions for all to authenticated using (true) with check (true);

-- equipment_type
create policy "equipment_type_select" on equipment_type for select to authenticated using (true);
create policy "equipment_type_all" on equipment_type for all to authenticated using (true) with check (true);

-- equipment_item
create policy "equipment_item_select" on equipment_item for select to authenticated using (true);
create policy "equipment_item_all" on equipment_item for all to authenticated using (true) with check (true);

-- equipment_loan
create policy "equipment_loan_select" on equipment_loan for select to authenticated using (true);
create policy "equipment_loan_all" on equipment_loan for all to authenticated using (true) with check (true);

-- equipment_loan_item
create policy "equipment_loan_item_select" on equipment_loan_item for select to authenticated using (true);
create policy "equipment_loan_item_all" on equipment_loan_item for all to authenticated using (true) with check (true);
