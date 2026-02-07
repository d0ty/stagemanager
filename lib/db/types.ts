export type StaffPosition = "hangtechnikus" | "fenytechnikus" | "stage" | "szervezo" | "egyeb";
export type RoleView = "equipment" | "programs" | "staff" | "task" | "chat" | "settings";
export type ProgramState =
  | "varakozo"
  | "tervezes"
  | "proba_alatt"
  | "veglegesites"
  | "lemondva"
  | "lezarva";
export type CrewPosition =
  | "Stage"
  | "hangtechnikus"
  | "fenytechnikus"
  | "fotos"
  | "videos"
  | "vetito";
export type TaskType = "sound" | "light";
export type TaskPriority = "alacsony" | "kozepes" | "magas";
export type TaskStatus = "teendo" | "folyamatban" | "kesz";
export type EquipmentCategory = "hangtechnika" | "fenytechnika" | "szinpad" | "kabel" | "egyeb";
export type EquipmentStatus = "elerheto" | "karbantartas" | "selejt";
export type EquipmentInventory = "foh" | "stage" | "egyeb" | "external";
export type LoanStatus = "aktiv" | "lezart";

export interface Role {
  id: number;
  name: string | null;
  color: string | null;
  add: RoleView[] | null;
  read: RoleView[] | null;
  update: RoleView[] | null;
  delete: RoleView[] | null;
}

export interface Staff {
  id: string;
  name: string | null;
  mention_name: string | null;
  position: StaffPosition | null;
  role: number | null;
}

export interface Program {
  id: number;
  date: string | null;
  location: string | null;
  description: string | null;
  status: ProgramState | null;
  leader: string | null;
  foh_list: string | null;
  stage_list: string | null;
  other_list: string | null;
}

export interface CrewMember {
  id: number;
  staff: string;
  program: number;
  role: CrewPosition | null;
}

export interface ProgramFile {
  id: number;
  program: number | null;
  file: string | null;
}

export interface Rehearsal {
  id: number;
  program: number | null;
  date: string | null;
  lesson_period: string | null;
  notes: string | null;
}

export interface Task {
  id: number;
  program: number | null;
  type: TaskType | null;
  assigned_to: string | null;
  priority: TaskPriority | null;
  status: TaskStatus | null;
  details: string | null;
}

export interface ChatMessage {
  id: number;
  message: string;
  sender: string;
  deleted: boolean | null;
}

export interface ChatMention {
  id: number;
  message: number;
  mentioned: string | null;
}

export interface EquipmentType {
  id: number;
  name: string;
  category: EquipmentCategory | null;
  description: string | null;
}

export interface EquipmentItem {
  id: number;
  type: number;
  serial: string;
  status: EquipmentStatus;
  notes: string | null;
}

export interface EquipmentLoan {
  id: number;
  start_date: string | null;
  expected_return_date: string | null;
  return_date: string | null;
  inventory: EquipmentInventory | null;
  status: LoanStatus | null;
  taken_by: Record<string, unknown> | null;
}

export interface EquipmentLoanItem {
  id: number;
  loan: number;
  item: number;
}
