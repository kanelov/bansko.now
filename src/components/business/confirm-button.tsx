"use client";

/** Бутон за изтриване, който пита преди да изпрати формата. */
export function ConfirmButton({
  message,
  className,
  children
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
