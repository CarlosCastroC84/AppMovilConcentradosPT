function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseJsonIfNeeded(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return value;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    return value;
  }
}

function extractErrorMessage(payload: unknown, fallbackStatus?: number): string {
  const normalizedPayload = parseJsonIfNeeded(payload);

  if (typeof normalizedPayload === 'string' && normalizedPayload.trim()) {
    return normalizedPayload;
  }

  if (isRecord(normalizedPayload)) {
    const errorKeys = ['message', 'error', 'details'];
    for (const key of errorKeys) {
      const value = normalizedPayload[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  return fallbackStatus
    ? `La API respondió con un error (${fallbackStatus}).`
    : 'La API respondió con un error inesperado.';
}

export function unwrapApiResponse<T>(response: unknown): T {
  let payload = response;
  let statusCode: number | undefined;

  if (isRecord(payload) && typeof payload['statusCode'] === 'number') {
    statusCode = payload['statusCode'] as number;
  }

  if (isRecord(payload) && 'body' in payload) {
    payload = parseJsonIfNeeded(payload['body']);
  }

  payload = parseJsonIfNeeded(payload);

  if (statusCode !== undefined && statusCode >= 400) {
    throw new Error(extractErrorMessage(payload, statusCode));
  }

  if (isRecord(payload) && typeof payload['statusCode'] === 'number') {
    const nestedStatusCode = payload['statusCode'] as number;
    if (nestedStatusCode >= 400) {
      throw new Error(extractErrorMessage(payload['body'] ?? payload, nestedStatusCode));
    }
  }

  if (isRecord(payload) && 'data' in payload) {
    return payload['data'] as T;
  }

  return payload as T;
}

export function unwrapApiArray<T>(
  response: unknown,
  candidateKeys: readonly string[] = ['items', 'productos', 'pedidos', 'data']
): T[] {
  const payload = unwrapApiResponse<unknown>(response);

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (isRecord(payload)) {
    for (const key of candidateKeys) {
      const candidate = payload[key];
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }

  return [];
}

export function unwrapApiEntity<T>(
  response: unknown,
  candidateKeys: readonly string[] = ['item', 'producto', 'pedido', 'data']
): T {
  const payload = unwrapApiResponse<unknown>(response);

  if (isRecord(payload)) {
    for (const key of candidateKeys) {
      if (key in payload) {
        return payload[key] as T;
      }
    }
  }

  return payload as T;
}
