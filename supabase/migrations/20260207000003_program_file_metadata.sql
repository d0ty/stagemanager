-- Add metadata columns to program_file table
alter table program_file add column if not exists file_name text;
alter table program_file add column if not exists file_path text;
alter table program_file add column if not exists file_size bigint;
alter table program_file add column if not exists mime_type text;
alter table program_file add column if not exists uploaded_at timestamp with time zone default now();
alter table program_file add column if not exists uploaded_by uuid references auth.users;

-- Rename 'file' column to 'file_url' for clarity (if it exists)
-- Note: This is safe because we're adding new columns
alter table program_file add column if not exists file_url text;
