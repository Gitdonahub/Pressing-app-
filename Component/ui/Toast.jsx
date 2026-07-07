export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: toast.type === "error" ? "#ef4444" : "#22c55e",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,.2)", fontWeight: 600,
      fontSize: 14, maxWidth: 320,
    }}>
      {toast.msg}
    </div>
  );
}
