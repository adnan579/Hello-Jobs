/** Format rupees the Indian way: 1234567 -> ₹12,34,567 */
export function rupees(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
}

/** Take-home as a share of gross, rounded to a whole percent. */
export function takeHomePercent(gross: number, inHand: number): number {
  if (gross <= 0) return 0;
  return Math.round((inHand / gross) * 100);
}
