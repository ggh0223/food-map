import { useState, useEffect } from "react";

interface ShopInputModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    contact: string;
  }) => void;
  defaultValues?: { name: string; description: string; contact: string };
}

export default function ShopInputModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
}: ShopInputModalProps) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [description, setDescription] = useState(
    defaultValues?.description || ""
  );
  const [contact, setContact] = useState(defaultValues?.contact || "");

  // defaultValues가 바뀔 때마다 input 값 동기화
  useEffect(() => {
    setName(defaultValues?.name || "");
    setDescription(defaultValues?.description || "");
    setContact(defaultValues?.contact || "");
  }, [defaultValues]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          minWidth: 300,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>상가 정보 입력</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="상가 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
          <input
            placeholder="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
          <input
            placeholder="연락처"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#eee",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={() => onSubmit({ name, description, contact })}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
