import dayjs from "dayjs";

export function formatDate(date: Date) {
  return dayjs(date).format("YYYY.M.D.");
}

export function formatTime(date: Date) {
  return dayjs(date).format("H:m");
}

export function formatDateTime(date: Date) {
  return dayjs(date).format("YYYY.M.D. H:m");
}
