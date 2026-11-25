/** Plain-language name for an HTTP failure, so every error says what kind it is. status 0 = no answer. */
export function describeHttpError(status: number, message = ''): string {
  if (status === 0) {
    return /timeout|aborted/i.test(message)
      ? 'Timed out: the API did not answer in 10 seconds. Try again.'
      : `Can't reach the API${message ? `: ${message}` : ''}`;
  }
  const kind =
    status === 400 ? 'Not accepted'
    : status === 401 ? 'Signed out — log in again'
    : status === 403 ? 'No permission'
    : status === 404 ? 'Not found'
    : status === 409 ? 'Conflict'
    : status === 422 ? 'Invalid data'
    : status === 429 ? 'Too many requests — wait a moment'
    : status >= 500 ? 'Server error'
    : 'Request failed';
  return `${kind} (${status})${message ? `: ${message}` : ''}`;
}
