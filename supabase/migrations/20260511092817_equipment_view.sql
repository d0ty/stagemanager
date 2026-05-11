create view equipment_details as
select
  equipment_loan.id as id,
  start_date,
  expected_return_date,
  return_date,
  inventory,
  status,
  taken_by,
  notes,
  count(items.id) as item_count
from equipment_loan
left join equipment_loan_item as items on items.loan = equipment_loan.id
group by equipment_loan.id;
