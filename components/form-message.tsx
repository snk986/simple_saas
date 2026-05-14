export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-sm">
      {"success" in message && (
        <div
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900"
          role="status"
          aria-live="polite"
        >
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 font-medium text-red-900"
          role="alert"
          aria-live="assertive"
        >
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div
          className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900"
          role="status"
          aria-live="polite"
        >
          {message.message}
        </div>
      )}
    </div>
  );
}
