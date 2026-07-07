export default function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          fontSize: 13, fontWeight: 600, display: "block",
          marginBottom: 5, color: "#374151",
        }}>
          {label}
        </label>
      )}
      <input {...props} style={{
        width: "100%",
        border: "1.5px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 14,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        ...props.style,
      }} />
    </div>
  );
}
