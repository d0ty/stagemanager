ALTER TABLE staff ADD COLUMN positions staff_position array;

create view staff_data as
    select staff.id as id, name, mention_name, positions, staff.role as role, user_data.email, user_data.phone from staff
    left join auth.users as user_data on staff.id = user_data.id;

grant all on table staff_data to authenticated;
