const db = require("../../config/db");

exports.confirmPayment = async (req, res) => {
  const { userID, tableID, slots, total } = req.body;

  const timeStart = slots[0].start;
  const timeEnd = slots[slots.length - 1].end;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ดึงจำนวน player ของโต๊ะ
    const [[table]] = await conn.query(
      "SELECT player FROM Tables WHERE id = ?",
      [tableID]
    );

    // 1️⃣ insert rentTables
    const [rent] = await conn.query(
      `INSERT INTO rentTables 
      (userID, tablesID, remainPlayer, timeStart, timeEnd)
      VALUES (?, ?, ?, ?, ?)`,
      [userID, tableID, table.player, timeStart, timeEnd]
    );

    // 2️⃣ insert statistic
    await conn.query(
      `INSERT INTO statistic (total) VALUES (?)`,
      [total]
    );

    await conn.commit();
    res.json({ message: "ชำระเงินสำเร็จ", rentTableID: rent.insertId });

  } catch (err) {
    await conn.rollback();
    res.status(500).json(err);
  } finally {
    conn.release();
  }
};
