const IST = 'Asia/Kolkata';

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', { timeZone: IST });
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { timeZone: IST });
}

export function relTime(d: Date | string, now = new Date()): string {
  const mins = Math.floor((now.getTime() - new Date(d).getTime()) / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function expiryLabel(expiresAt: Date | string, now = new Date()): string {
  const days = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return 'Expired';
  return days === 1 ? 'Expires in 1 day' : `Expires in ${days} days`;
}
