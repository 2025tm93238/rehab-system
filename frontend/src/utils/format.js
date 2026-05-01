// Format a date or ISO string for display in tables/cards.
// Example: "2 May 2026, 10:00"
export function formatDateTime(input) {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Convert an ISO timestamp into the form expected by <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm"). Useful when pre-filling reschedule forms.
export function toDateTimeLocalValue(input) {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) +
    ':' + pad(d.getMinutes())
  );
}
