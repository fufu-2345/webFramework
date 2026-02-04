"use client";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

export default function GamePage() {
  // --- STATE ---
  const [rentTableId, setRentTableId] = useState(null); // ตัวแปรเก็บ ID โต๊ะจาก URL
  const [activeTab, setActiveTab] = useState("available");
  const [games, setGames] = useState([]);
  const [borrowedGames, setBorrowedGames] = useState([]);
  const [search, setSearch] = useState("");
  const [player, setPlayer] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 1. ดึง ID จาก URL เมื่อเข้าหน้าเว็บ ---
  useEffect(() => {
    // ดึงค่าจาก Browser URL (เช่น ?tableId=16)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("tableId");

      if (id) {
        setRentTableId(id);
      } else {
        console.warn("ไม่พบ tableId ใน URL");
      }
    }
  }, []);

  // --- 2. เมื่อได้ ID โต๊ะมาแล้ว ให้โหลดข้อมูลเกมทันที ---
  useEffect(() => {
    if (rentTableId) {
      fetchGames();
      fetchBorrowedGames();
    }
  }, [rentTableId]);

  // --- FUNCTIONS ---

  const fetchGames = async (filters = {}) => {
    setLoading(true);
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.player) params.append("player", filters.player);
    if (filters.type) params.append("type", filters.type);

    try {
      const res = await fetch(
        `http://localhost:5000/game/filter?${params.toString()}`
      );
      const data = await res.json();
      setGames(data);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrowedGames = async () => {
    if (!rentTableId) return;

    try {
      // ใช้ rentTableId แบบ Dynamic ที่ได้จาก URL
      const res = await fetch(
        `http://localhost:5000/game/borrowed/${rentTableId}`
      );
      const data = await res.json();
      setBorrowedGames(data);
    } catch (error) {
      console.error("Error fetching borrowed games:", error);
    }
  };

  const handleBorrow = async (gameID) => {
    if (!rentTableId) if (!rentTableId) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'กรุณาระบุโต๊ะก่อนยืมเกม (ตรวจสอบ URL).',
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/game/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentTablesID: rentTableId, // ✅ ใช้ ID จาก URL
          gameID,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: data.error || "เกิดข้อผิดพลาดในการยืมเกม",
        });
        return;
      }

      fetchGames({ search, player, type });
      fetchBorrowedGames();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error.message || "เกิดข้อผิดพลาดในการยืมเกม",
      });
    }
  };

  const handleReturn = async (gameID) => {
    if (!rentTableId) return
    Swal.fire({
      icon: 'success',
      title: 'คืนเกมสำเร็จ!',
      text: "คุณได้คืนเกมเรียบร้อยแล้ว",
    });

    try {
      const res = await fetch("http://localhost:5000/game/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentTablesID: rentTableId, // ✅ ใช้ ID จาก URL
          gameID: gameID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: data.error,
        });
        return;
      }

      // โหลดข้อมูลใหม่ทั้งสองส่วน
      fetchBorrowedGames();
      fetchGames({ search, player, type });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error.message || "เกิดข้อผิดพลาดในการคืนเกม",
      });
    }
  };

  const handleFilter = () => {
    fetchGames({ search, player, type });
  };

  // --- RENDER: กรณีไม่มีเลขโต๊ะ ---
  if (!rentTableId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", backgroundColor: "white", minHeight: "100vh" }}>
        <h1>🚫 ไม่พบข้อมูลโต๊ะ</h1>
        <p>กรุณาสแกน QR Code ใหม่อีกครั้ง หรือเข้าผ่านลิงก์ที่ระบุเลขโต๊ะ</p>
        <p>ตัวอย่าง URL: <code>http://localhost:3000/game?tableId=16</code></p>
      </div>
    );
  }

  // --- RENDER: หน้าปกติ ---
  return (
    <div style={{ padding: 30, backgroundColor: "white", minHeight: "100vh", color: "black" }}>
      <h1>🎲 ระบบยืมบอร์ดเกม</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          style={{ border: "2px solid black", width: 200, padding: 5 }}
          placeholder="ค้นหาชื่อเกม"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          style={{ border: "2px solid black", width: 90, padding: 5 }}
          type="number"
          placeholder="ผู้เล่นขั้นต่ำ"
          min={1}
          value={player}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || Number(v) >= 1) setPlayer(v);
          }}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ border: "2px solid black", width: 110, padding: 5 }}
        >
          <option value="">ทุกประเภท</option>
          <option value="easy">Easy</option>
          <option value="party">Party</option>
          <option value="strategy">Strategy</option>
        </select>

        <button onClick={handleFilter} style={{ cursor: 'pointer', backgroundColor: '#ddd', border: '2px solid black' }}>ค้นหา 🔎</button>
      </div>

      {/* --- TABS --- */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid black",
          marginBottom: 20,
        }}
      >
        <div
          onClick={() => setActiveTab("available")}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            border: "2px solid black",
            borderBottom: activeTab === "available" ? "2px solid white" : "2px solid black",
            backgroundColor: activeTab === "available" ? "white" : "#eaeaea",
            fontWeight: activeTab === "available" ? "bold" : "normal",
            marginBottom: -2
          }}
        >
          📦 เกมที่มีให้ยืม
        </div>

        <div
          onClick={() => setActiveTab("borrowed")}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            border: "2px solid black",
            borderBottom: activeTab === "borrowed" ? "2px solid white" : "2px solid black",
            backgroundColor: activeTab === "borrowed" ? "white" : "#eaeaea",
            fontWeight: activeTab === "borrowed" ? "bold" : "normal",
            marginBottom: -2
          }}
        >
          🎮 เกมที่กำลังยืม
        </div>
      </div>

      {/* --- TAB CONTENT: AVAILABLE --- */}
      {activeTab === "available" && (
        <div>
          {loading && <p>กำลังโหลด...</p>}
          {!loading && games.length === 0 && <p>ไม่พบเกม</p>}

          {games.map((game) => (
            <div
              key={game.id}
              style={{
                border: "1px solid black",
                padding: 12,
                marginBottom: 10,
                backgroundColor: "white",
                borderRadius: 4
              }}
            >
              <h4 style={{ margin: "0 0 5px 0" }}>{game.name}</h4>
              <div style={{ fontSize: "0.9em" }}>ประเภท: {game.type}</div>
              <div style={{ fontSize: "0.9em" }}>👥 {game.player} คน</div>
              <div style={{ fontSize: "0.9em", color: game.remain > 0 ? "green" : "red" }}>
                📦 คงเหลือ {game.remain}
              </div>

              <button
                disabled={game.remain <= 0}
                onClick={() => handleBorrow(game.id)}
                style={{
                  marginTop: 8,
                  padding: "5px 10px",
                  cursor: game.remain > 0 ? "pointer" : "not-allowed",
                  backgroundColor: game.remain > 0 ? "#e0f7fa" : "#ccc",
                  border: "1px solid black"
                }}
              >
                ยืมเกม
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB CONTENT: BORROWED --- */}
      {activeTab === "borrowed" && (
        <div style={{ backgroundColor: "white", minHeight: "50vh", color: "black" }}>
          {borrowedGames.length === 0 && <p>ยังไม่มียืมเกม</p>}

          {borrowedGames.map((game, index) => (
            <div
              key={`${game.rentgameID}-${index}`}
              style={{
                border: "1px solid black",
                padding: 12,
                marginBottom: 10,
                backgroundColor: "#fff8e1", // สีพื้นหลังต่างนิดหน่อยให้รู้ว่าเป็นเกมที่ยืมมา
                borderRadius: 4
              }}
            >
              <h4 style={{ margin: "0 0 5px 0" }}>{game.name}</h4>
              <div style={{ fontSize: "0.9em" }}>👥 ใช้ผู้เล่น {game.player}</div>

              <button
                onClick={() => handleReturn(game.gameID)}
                style={{
                  marginTop: 8,
                  padding: "5px 10px",
                  cursor: "pointer",
                  backgroundColor: "#ffcdd2",
                  border: "1px solid black"
                }}
              >
                คืนเกม
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
