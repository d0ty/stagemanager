import { createClient } from "@/lib/supabase/client";
import type {
  EquipmentType,
  EquipmentItem,
  EquipmentLoan,
  EquipmentLoanItem,
  EquipmentCategory,
  EquipmentInventory,
} from "./types";

export async function listEquipmentTypes(): Promise<EquipmentType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_type")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as EquipmentType[];
}

export async function listEquipmentItems(): Promise<EquipmentItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_item")
    .select("*")
    .order("id");
  if (error) throw error;
  return (data ?? []) as EquipmentItem[];
}

export async function listEquipmentItemsByType(
  typeId: number,
): Promise<EquipmentItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_item")
    .select("*")
    .eq("type", typeId)
    .order("serial");
  if (error) throw error;
  return (data ?? []) as EquipmentItem[];
}

export async function listEquipmentItemsByCategory(
  category: EquipmentCategory,
): Promise<(EquipmentItem & { equipment_type: EquipmentType })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_item")
    .select("*, equipment_type:equipment_type!inner(*)")
    .eq("equipment_type.category", category)
    .order("id");
  if (error) throw error;
  return (data ?? []) as (EquipmentItem & { equipment_type: EquipmentType })[];
}

export async function listEquipmentLoans(
  status?: "aktiv" | "lezart",
): Promise<EquipmentLoan[]> {
  const supabase = createClient();
  let query = supabase.from("equipment_loan").select("*");
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("start_date", {
    ascending: false,
    nullsFirst: false,
  });
  if (error) throw error;
  return (data ?? []) as EquipmentLoan[];
}

export async function getEquipmentLoansByProgram(
  program: number,
): Promise<Record<"foh" | "stage" | "egyeb", EquipmentLoan>> {
  const supabase = createClient();
  let query = supabase
    .from("equipment_loan")
    .select()
    .eq("taken_by->program", program);
  const { data, error } = await query.order("start_date", {
    ascending: false,
    nullsFirst: false,
  });
  console.log(data, program);
  if (error) throw error;
  return Object.fromEntries(
    (["foh", "stage", "egyeb"] as EquipmentInventory[]).map((inv) => {
      return [inv, data.find((l) => l.inventory == inv)];
    }),
  ) as Record<"foh" | "stage" | "egyeb", EquipmentLoan>;
}

export async function listEquipmentLoanItems(): Promise<EquipmentLoanItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_loan_item")
    .select("*");
  if (error) throw error;
  return (data ?? []) as EquipmentLoanItem[];
}

export async function createEquipmentLoan(
  loan: Omit<EquipmentLoan, "id">,
): Promise<EquipmentLoan> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_loan")
    .insert(loan as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentLoan;
}

export async function updateEquipmentLoan(
  id: number,
  updates: Partial<EquipmentLoan>,
): Promise<EquipmentLoan> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_loan")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentLoan;
}

export async function deleteEquipmentLoan(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("equipment_loan").delete().eq("id", id);
  if (error) throw error;
}

export async function createEquipmentLoanItem(
  loanItem: Omit<EquipmentLoanItem, "id">,
): Promise<EquipmentLoanItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_loan_item")
    .insert(loanItem as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentLoanItem;
}

export async function getLoanItemsByLoan(
  loanId: number,
): Promise<EquipmentLoanItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_loan_item")
    .select("*")
    .eq("loan", loanId);
  if (error) throw error;
  return (data ?? []) as EquipmentLoanItem[];
}

export async function deleteLoanItemsByLoan(loanId: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("equipment_loan_item")
    .delete()
    .eq("loan", loanId);
  if (error) throw error;
}

export async function deleteLoanItem(loanItemId: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("equipment_loan_item")
    .delete()
    .eq("id", loanItemId);
  if (error) throw error;
}

export async function createEquipmentType(
  type: Omit<EquipmentType, "id">,
): Promise<EquipmentType> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_type")
    .insert(type as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentType;
}

export async function updateEquipmentType(
  id: number,
  updates: Partial<EquipmentType>,
): Promise<EquipmentType> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_type")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentType;
}

export async function deleteEquipmentType(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("equipment_type").delete().eq("id", id);
  if (error) throw error;
}

export async function createEquipmentItem(
  item: Omit<EquipmentItem, "id">,
): Promise<EquipmentItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_item")
    .insert(item as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentItem;
}

export async function updateEquipmentItem(
  id: number,
  updates: Partial<EquipmentItem>,
): Promise<EquipmentItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment_item")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as EquipmentItem;
}

export async function deleteEquipmentItem(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("equipment_item").delete().eq("id", id);
  if (error) throw error;
}
