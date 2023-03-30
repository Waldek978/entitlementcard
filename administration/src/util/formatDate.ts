const formatDateWithTimezone = (dateString: string, timezone: string): string =>
  new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(
    new Date(dateString)
  )
export default formatDateWithTimezone
