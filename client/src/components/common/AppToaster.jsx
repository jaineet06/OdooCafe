import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        duration: 3500,
        style: {
          background: "var(--color-bg-elevated)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          fontSize: "14px",
          fontFamily: "var(--font-body)",
          boxShadow: "none",
        },
        success: {
          iconTheme: { primary: "var(--color-accent-success)", secondary: "var(--color-bg-elevated)" },
        },
        error: {
          iconTheme: { primary: "var(--color-accent-danger)", secondary: "var(--color-bg-elevated)" },
        },
      }}
    />
  );
}
