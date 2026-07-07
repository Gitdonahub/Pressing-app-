export default function Button({ children, variant = "primary", ...props }) {
  const bg = variant === "primary" ? "#2563eb"
    : variant === "danger" ? "#ef4444"
    : variant === "purple" ? "#7c3aed"
    : "#f1f5f9";
  const color = variant === "ghost" ? "#374151" : "#fff";

  return (
    <button {...props} style={{
      background: props.disabled ? "#94a3b8" : bg,
      color,
      border: "none",
      borderRadius: 8,
      padding: "10px 18px",
      fontSize: 14,
      fontWeight: 600,
      cursor: props.disabled ? "not-allowed" : "pointer",
      ...props.style,
    }}>
      {children}
    </button>
  );
}
