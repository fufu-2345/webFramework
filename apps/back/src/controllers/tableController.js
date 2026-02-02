const db = require("../config/db");

// --- Helper: สร้าง Slot เวลา (08:00 - 20:00) ---
const createSlots = (date) => {
  const slots = [];
  for (let h = 8; h < 20; h++) {
    slots.push({
      start: `${date} ${String(h).padStart(2, "0")}:00:00`,
      end: `${date} ${String(h + 1).padStart(2, "0")}:00:00`,
      label: `${h}:00 - ${h + 1}:00`
    });
  }
  return slots;
};

// --- Helper: บันทึกรายได้ (Revenue) ลงตาราง Statistic ---
// ฟังก์ชันนี้จะถูกเรียกวนลูปตามจำนวนชั่วโมงที่จอง
const recordRevenueStatistic = async (conn, timeStart, amount) => {
  // ปรับเวลาให้เป็นชั่วโมงถ้วน (ตัดนาที/วินาที)
  const timeSlot = new Date(timeStart);
  timeSlot.setMinutes(0, 0, 0);

  // 1. เช็คว่ามีสถิติของชั่วโมงนี้หรือยัง
  const [stats] = await conn.query(
    `SELECT id FROM statistic WHERE DATE_FORMAT(timestart, '%Y-%m-%d %H:00:00') 
         = DATE_FORMAT(?, '%Y-%m-%d %H:00:00')`,
    [timeSlot]
  );

  if (stats.length > 0) {
    // 2. ถ้ามีแล้ว -> บวกเงินเพิ่ม (UPDATE total)
    await conn.query(
      `UPDATE statistic SET total = total + ? WHERE id = ?`,
      [amount, stats[0].id]
    );
  } else {
    // 3. ถ้ายังไม่มี -> สร้างใหม่ (INSERT) ใส่เงินเข้าไป (game เป็นค่าว่างไปก่อน)
    await conn.query(
      `INSERT INTO statistic (timestart, total, game) VALUES (?, ?, '{}')`,
      [timeSlot, amount]
    );
  }
};

// --- API: ดึงเวลาว่าง ---
exports.getAvailableTime = async (req, res) => {
  try {
    const { date, tableID } = req.query;
    if (!date || !tableID) {
      return res.status(400).json({ error: "กรุณาระบุวันที่และรหัสโต๊ะ" });
    }

    const slots = createSlots(date);

    // ดึงช่วงเวลาที่มีคนจองไปแล้ว
    const [used] = await db.query(
      `SELECT timeStart, timeEnd 
       FROM rentTables
       WHERE tablesID = ?
       AND DATE(timeStart) = ?`,
      [tableID, date]
    );

    // ตรวจสอบการชนกันของเวลา (Clash Check)
    const result = slots.map(s => {
      const clash = used.some(u =>
        new Date(u.timeStart) < new Date(s.end) &&
        new Date(u.timeEnd) > new Date(s.start)
      );
      return { ...s, available: !clash };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// --- API: จองโต๊ะ (พร้อมบันทึกยอดเงิน) ---
exports.reserveTable = async (req, res) => {
  const { userID, tableID, slots } = req.body;

  // ✅ ใช้ Connection เพื่อทำ Transaction (สำคัญมาก)
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction(); // เริ่มต้น Transaction

    const timeStart = slots[0].start;
    const timeEnd = slots[slots.length - 1].end;

    // 1. ดึงข้อมูลโต๊ะ (เพื่อเอาราคา cost)
    const [[table]] = await conn.query(
      "SELECT player, cost FROM Tables WHERE id = ?",
      [tableID]
    );

    if (!table) throw new Error("ไม่พบข้อมูลโต๊ะ");

    // 2. บันทึกการจองลง rentTables
    const [result] = await conn.query(
      `INSERT INTO rentTables 
       (userID, tablesID, remainPlayer, timeStart, timeEnd)
       VALUES (?, ?, ?, ?, ?)`,
      [userID, tableID, table.player, timeStart, timeEnd]
    );

    // 3. ✅ วนลูปบันทึกยอดเงินลง Statistic ตามจำนวน Slot ที่จอง
    // เช่น จอง 2 ชม. (10:00, 11:00) ก็จะบันทึกเงินเข้าสถิติของทั้ง 2 ชั่วโมง
    for (const slot of slots) {
      // ส่ง connection, เวลาเริ่มของ slot, และราคาต่อชม.
      await recordRevenueStatistic(conn, slot.start, table.cost);
    }

    await conn.commit(); // ยืนยันข้อมูลลง DB

    // 4. ส่ง rentTableId กลับไปให้ Frontend (เพื่อใช้ Redirect)
    res.json({
      message: "🎮จองเวลาเรียบร้อย ไปหน้ายืมเกม🎮",
      rentTableId: result.insertId
    });

  } catch (error) {
    await conn.rollback(); // ถ้าพัง ให้ยกเลิกทั้งหมด
    console.error("Reservation Error:", error);
    res.status(500).json({ message: "จองไม่สำเร็จ", error: error.message });
  } finally {
    conn.release(); // คืน Connection
  }
};

// --- API: ดึงรายชื่อโต๊ะ ---
exports.getTables = async (req, res) => {
  try {
    // เช็คชื่อตารางใน DB ให้ดีว่า 'Tables' หรือ 'tables' (ในโค้ดนี้ใช้ Tables ตัวใหญ่ตามที่คุณส่งมา)
    const [tables] = await db.query("SELECT * FROM Tables ORDER BY id");
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};