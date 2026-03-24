export function nanoid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
