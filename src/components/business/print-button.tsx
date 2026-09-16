"use client";

/** Отваря диалога за печат на браузъра (за QR листа и менюто за печат). */
export function PrintButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
