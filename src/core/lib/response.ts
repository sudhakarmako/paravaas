/**
 * Standard JSON response headers
 */
const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * Creates a JSON response with standard headers
 */
export function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

/**
 * Creates a success response (200 OK)
 */
export function successResponse<T>(data: T): Response {
  return jsonResponse(data, 200);
}

/**
 * Creates a created response (201 Created)
 */
export function createdResponse<T>(data: T): Response {
  return jsonResponse(data, 201);
}

/**
 * Creates an error response
 */
export function errorResponse(message: string, status: number = 500): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Creates a bad request response (400)
 */
export function badRequestResponse(message: string): Response {
  return errorResponse(message, 400);
}

/**
 * Creates a not found response (404)
 */
export function notFoundResponse(
  message: string = "Resource not found"
): Response {
  return errorResponse(message, 404);
}

/**
 * Creates an internal server error response (500)
 */
export function internalErrorResponse(
  message: string = "Internal server error"
): Response {
  return errorResponse(message, 500);
}
