// Error handling utilities
interface ApiError {
  response?: {
    data?: {
      errors?: Record<string, string[]>;
      message?: string;
    };
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
}

export function extractErrorMessage(error: unknown, defaultMessage: string): string {
  if (isApiError(error)) {
    const data = error.response?.data;
    if (data?.errors) {
      // Return first error message from any field
      const firstField = Object.keys(data.errors)[0];
      if (firstField && data.errors[firstField]?.[0]) {
        return data.errors[firstField][0];
      }
    }
    if (data?.message) {
      return data.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
}