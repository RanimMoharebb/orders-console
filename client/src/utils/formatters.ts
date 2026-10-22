const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDate(dateString: string): string {
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) {
    return 'Invalid date'
  }
  return dateFormatter.format(parsed)
}
