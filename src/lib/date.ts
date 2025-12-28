export function formatWaktuID(iso: string) {
  const dt = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}
