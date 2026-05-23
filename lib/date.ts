import dayjs from "dayjs";

export function formatDate(date: Date) {
  return dayjs(date).format("YYYY.MM.DD.");
}

export function formatTime(date: Date) {
  return dayjs(date).format("H:mm");
}

export function formatDateTime(date: Date) {
  return dayjs(date).format("YYYY.MM.DD. H:mm");
}
