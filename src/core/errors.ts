/**
 * 처리되지 않은 오류와 Promise 거부를 받아 사용자에게 알린다.
 * 기본 콘솔 출력은 막지 않는다. 반환 함수로 listener를 제거한다.
 */
export function watchUncaughtErrors(
  onError: (message: string) => void,
  target: EventTarget = window,
): () => void {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  target.addEventListener(
    'error',
    (event) => onError(describe((event as ErrorEvent).error ?? event)),
    options,
  );
  target.addEventListener(
    'unhandledrejection',
    (event) => onError(describe((event as PromiseRejectionEvent).reason)),
    options,
  );
  return () => controller.abort();
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value)
    return String(value.message);
  return 'An unexpected error occurred.';
}
