import type { ApiResponse, ApiValidationErrorDetail } from '../types'

export class ApiError extends Error {
  public status: number
  public details?: ApiValidationErrorDetail[]

  constructor(
    message: string,
    status: number,
    details?: ApiValidationErrorDetail[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string | null
  idempotencyKey?: string
  body?: unknown
  onUnauthorized?: () => void
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    token,
    idempotencyKey,
    onUnauthorized,
    headers: customHeaders,
    body,
    ...rest
  } = options

  const headers = new Headers(customHeaders)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey)
  }

  let serializedBody: BodyInit | undefined = undefined
  if (body !== undefined && body !== null) {
    if (typeof body === 'string' || body instanceof FormData || body instanceof Blob) {
      serializedBody = body
    } else {
      headers.set('Content-Type', 'application/json')
      serializedBody = JSON.stringify(body)
    }
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      headers,
      body: serializedBody,
      ...rest,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Network connection failure.',
      0,
    )
  }

  if (response.status === 401) {
    onUnauthorized?.()
    throw new ApiError('Session expired. Please sign in again.', 401)
  }

  let payload: ApiResponse<T> | null = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      payload = (await response.json()) as ApiResponse<T>
    } catch {
      throw new ApiError('Malformed JSON received from server.', response.status)
    }
  }

  if (!response.ok) {
    const errorDetails = payload?.details
    const formattedDetails = Array.isArray(errorDetails) && errorDetails.length > 0
      ? errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')
      : undefined

    const errorMessage =
      payload?.error ||
      formattedDetails ||
      `Request failed with status ${response.status}.`

    throw new ApiError(errorMessage, response.status, errorDetails)
  }

  return (payload as unknown) as T
}
