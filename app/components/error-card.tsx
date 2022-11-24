export function ErrorCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="form-error-message"
      className="p-4 border border-red-600 rounded-md"
    >
      <p className="text-red-600 font-medium">Error</p>
      <p role="alert" className="text-16-medium">
        {children}
      </p>
    </div>
  );
}
