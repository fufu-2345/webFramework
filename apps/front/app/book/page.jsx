"use client";
import { useState, useEffect } from "react";
import qrImage from "./qr.png";

export default function BookPage() {
  const userID = 2; // สมมติ User ID

  // 1. เปลี่ยน TABLES const เป็น state เพื่อรอรับจาก DB
  const [tables, setTables] = useState([]); 
  const [table, setTable] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [select, setSelect] = useState([]);

  // State สำหรับคุมการเปิด/ปิด Popup
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // --- USE EFFECT: โหลดข้อมูลโต๊ะเมื่อเปิดหน้าเว็บ ---
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch("http://localhost:5000/tables");
        const data = await res.json();
        setTables(data); 
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };
    fetchTables();
  }, []);

  /* --- โหลด slot --- */
  const loadSlots = async (d, tableID) => {
    setDate(d);
    setSelect([]);
    setSlots([]); 

    try {
        const res = await fetch(
          `http://localhost:5000/tables/available?date=${d}&tableID=${tableID}`
        );
        const data = await res.json();
        setSlots(data);
    } catch (error) {
        console.error("Error fetching slots:", error);
    }
  };

  /* ตรวจว่าช่วงเวลาติดกันไหม */
  const isContiguous = (slot) => {
    if (select.length === 0) return true;
    const sorted = [...select].sort((a, b) => a.start.localeCompare(b.start));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return slot.start === last.end || slot.end === first.start;
  };

  const toggleSlot = (slot) => {
    if (!slot.available) return;
    const exists = select.some((s) => s.start === slot.start);
    if (exists) {
      setSelect(select.filter((s) => s.start !== slot.start));
      return;
    }
    if (!isContiguous(slot)) {
      alert("⛔ ต้องเลือกช่วงเวลาที่ติดกันเท่านั้น");
      return;
    }
    setSelect([...select, slot]);
  };

  const total = table ? select.length * table.cost : 0;

  /* --- ฟังก์ชันยืนยันการชำระเงิน (ส่งข้อมูลเข้า reserveTable ทีเดียว) --- */
  const confirmPayment = async () => {
    try {
      // Backend รับ body: { userID, tableID, slots }
      const res = await fetch("http://localhost:5000/tables/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID,
          tableID: table.id,
          slots: select, 
        }),
      });

      const result = await res.json();

      if (!res.ok) {
         throw new Error(result.message || "เกิดข้อผิดพลาด");
      }

      // ปิด Popup และแจ้งเตือน
      setShowPaymentModal(false);
      alert("🎉 " + result.message); 

      // ✅ จุดที่แก้ไข: ใช้ rentTableId ที่ Backend ส่งกลับมา (result.rentTableId)
      // ID นี้คือ rentTable.id (Primary Key ของการจองครั้งนี้)
      if (result.rentTableId) {
         window.location.href = `http://localhost:3000/borrow?tableId=${result.rentTableId}`;
      } else {
         console.error("ไม่ได้รับ rentTableId จาก Backend");
         // กรณีกันเหนียว: ถ้าไม่มี ID ให้กลับไปหน้าหลักหรือแจ้งเตือน
      }

    } catch (error) {
      console.error(error);
      alert("❌ " + error.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🪑จองโต๊ะบอร์ดเกม</h2>

        {/* ===== เลือกโต๊ะ ===== */}
        <p style={styles.label}>เลือกขนาดโต๊ะ</p>
        <div style={styles.tableGrid}>
          {tables.length === 0 && <p>Loading tables...</p>}
          {tables.map((t) => (
            <button
              key={t.id}
              style={{
                ...styles.tableBtn,
                background: table?.id === t.id ? "#4f46e5" : "#fff",
                color: table?.id === t.id ? "#fff" : "#000",
              }}
              onClick={() => {
                setTable(t);
                setSlots([]);
                setSelect([]);
                // ถ้าเลือกวันที่ค้างไว้ ให้โหลด slot ใหม่
                if (date) loadSlots(date, t.id);
                else setDate("");
              }}
            >
              โต๊ะ {t.id}
              <br />
              👥 {t.player} คน
              <br />
              💰 {t.cost}/ชม.
            </button>
          ))}
        </div>

        {/* ===== เลือกวัน ===== */}
        {table && (
          <>
            <label style={styles.label}>เลือกวันที่</label>
            <input
              type="date"
              style={styles.input}
              value={date} 
              onChange={(e) => loadSlots(e.target.value, table.id)}
            />
          </>
        )}

        {/* ===== เลือกเวลา ===== */}
        {slots.length > 0 && (
          <>
            <p style={styles.sub}>เลือกเวลา</p>
            <div style={styles.slotGrid}>
              {slots.map((s) => {
                const active = select.some((x) => x.start === s.start);
                return (
                  <button
                    key={s.start}
                    disabled={!s.available}
                    onClick={() => toggleSlot(s)}
                    style={{
                      ...styles.slot,
                      background: active ? "#4f46e5" : "#fff",
                      color: active ? "#fff" : "#000",
                      opacity: s.available ? 1 : 0.4,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ===== ปุ่มไปหน้าชำระเงิน ===== */}
        {select.length > 0 && (
          <div style={styles.summary}>
            <p>⏱ {select.length} ชั่วโมง</p>
            <p>รวม {total} บาท</p>
            {/* กดปุ่มนี้ เพื่อเปิด Popup */}
            <button style={styles.primaryBtn} onClick={() => setShowPaymentModal(true)}>
              ไปจ่ายเงิน →
            </button>
          </div>
        )}
      </div>

      {/* ===== POPUP (MODAL) จ่ายเงิน ===== */}
      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>💳 สแกนจ่ายเงิน</h3>
              <button
                style={styles.closeBtn}
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ marginBottom: 10, fontSize: 18 }}>ยอดชำระ <strong>{total}</strong> บาท</p>

            <div style={styles.qrWrapper}>
              <img src={qrImage.src} alt="QR Payment" style={styles.qrImage} />            </div>

            <p style={{ color: "#666", fontSize: 14, margin: "10px 0" }}>
              กรุณาสแกน QR Code ด้านบน
            </p>

            <button style={styles.primaryBtn} onClick={confirmPayment}>
              ตรวจสอบการชำระเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Sarabun', sans-serif",
  },
  card: {
    width: 620,
    padding: 32,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
  },
  title: {
    fontSize: 26,
    marginBottom: 24,
    color: "#000000",
    fontWeight: "800",
    textAlign: "center",
  },
  label: {
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 8,
    display: "block",
    color: "#111827",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 16,
  },
  sub: {
    marginTop: 24,
    marginBottom: 12,
    fontWeight: 600,
    color: "#374151",
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  tableBtn: {
    padding: 16,
    borderRadius: 12,
    border: "2px solid transparent",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  slotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  slot: {
    padding: "10px 4px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  summary: {
    marginTop: 32,
    padding: 20,
    background: "#f3f4f6",
    borderRadius: 12,
    textAlign: "center",
    color: "black",
  },
  primaryBtn: {
    marginTop: 16,
    padding: "12px 24px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
  },

  modalOverlay: {
    color: "black",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContent: {
    color: "black",
    background: "#fff",
    padding: 30,
    borderRadius: 16,
    width: 400,
    maxWidth: "90%",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  modalHeader: {
    color: "black",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#999",
  },
  qrWrapper: {
    background: "#f9fafb",
    padding: 20,
    borderRadius: 12,
    display: "inline-block",
    marginBottom: 10,
    border: "1px solid #e5e7eb"
  },
  qrImage: {
    width: 200,
    height: 200,
    objectFit: "contain",
    display: "block"
  }
};
