const db = require("../../config/db"); 


exports.getAllGames = async (req, res) => {
    try {
        const [games] = await db.query("SELECT * FROM Game");
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.getBorrowedGames = async (req, res) => {
    const { rentTablesID } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT
                rg.id AS rentGameID,
                rg.gameID,
                g.name,
                g.player
            FROM rentGame rg
            JOIN Game g ON rg.gameID = g.id
            WHERE rg.rentTablesID = ?`,
            [rentTablesID]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const recordGameStatistic = async (conn, rentTablesID, gameID, gameName) => {
    try {
        const [rentTable] = await conn.query(
            `SELECT timestart FROM rentTables WHERE id = ?`,
            [rentTablesID]);

        if (!rentTable.length) return;

        const timeSlot = new Date(rentTable[0].timestart);
        timeSlot.setMinutes(0, 0, 0);

        const [stats] = await conn.query(
            `SELECT * FROM statistic WHERE DATE_FORMAT(timestart, '%Y-%m-%d %H:00:00') 
                = DATE_FORMAT(?, '%Y-%m-%d %H:00:00')`,
            [timeSlot]
        );

        if (stats.length > 0) {
            const stat = stats[0];
            let games = {};

            if (stat.game) {
                if (typeof stat.game === 'string') {
                    try {
                        games = JSON.parse(stat.game);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        games = {};
                    }
                } else if (typeof stat.game === 'object') {
                    games = stat.game;
                }
            }

            if (games[gameName]) {
                games[gameName] = games[gameName] + 1;
            } else {
                games[gameName] = 1;
            }

            await conn.query(
                `UPDATE statistic SET game = ? WHERE id = ?`,
                [JSON.stringify(games), stat.id]
            );

        } else {
            const gameStats = {
                [gameName]: 1
            };

            await conn.query(
                `INSERT INTO statistic (timestart, total, game) VALUES (?, 0, ?)`,
                [timeSlot, JSON.stringify(gameStats)]
            );
        }

    } catch (err) {
        console.error('บันทึกสถิติผิดพลาด:', err);
    }
};


exports.borrowGame = async (req, res) => {
    const { rentTablesID, gameID } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [gameRows] = await conn.query(
            "SELECT * FROM Game WHERE id = ? FOR UPDATE",
            [gameID]
        );
        if (!gameRows.length) throw new Error("ไม่พบเกม");

        const game = gameRows[0];
        if (game.remain <= 0) throw new Error("เกมหมด");

        const [tableRows] = await conn.query(
            "SELECT * FROM rentTables WHERE id = ? FOR UPDATE",
            [rentTablesID]
        );
        if (!tableRows.length) throw new Error("ไม่พบโต๊ะ");

        const table = tableRows[0];
        if (table.remainPlayer < game.player)
            throw new Error("จำนวนคนในโต๊ะไม่พอ");

        await conn.query(
            "UPDATE Game SET remain = remain - 1 WHERE id = ?",
            [gameID]
        );

        await conn.query(
            "UPDATE rentTables SET remainPlayer = remainPlayer - ? WHERE id = ?",
            [game.player, rentTablesID]
        );

        await conn.query(
            "INSERT INTO rentGame (rentTablesID, gameID) VALUES (?, ?)",
            [rentTablesID, gameID]
        );

        await recordGameStatistic(conn, rentTablesID, gameID, game.name);

        await conn.commit();
        res.json({ message: "ยืมเกมสำเร็จ" });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        conn.release();
    }
};


exports.returnGame = async (req, res) => {
  const { rentTablesID, gameID } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[game]] = await conn.query(
      "SELECT * FROM Game WHERE id = ? FOR UPDATE",
      [gameID]
    );
    if (!game) throw new Error("ไม่พบเกม");

    const [[rent]] = await conn.query(
      "SELECT * FROM rentGame WHERE rentTablesID = ? AND gameID = ? LIMIT 1",
      [rentTablesID, gameID]
    );
    if (!rent) throw new Error("ยังไม่ได้ยืมเกมนี้");

    await conn.query("DELETE FROM rentGame WHERE id = ?", [rent.id]);

    await conn.query(
      "UPDATE Game SET remain = remain + 1 WHERE id = ?",
      [gameID]
    );

    await conn.query(
      "UPDATE rentTables SET remainPlayer = remainPlayer + ? WHERE id = ?",
      [game.player, rentTablesID]
    );

    await conn.commit();
    res.json({ message: "คืนเกมสำเร็จ" });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.filterGames = async (req, res) => {
    const { player, type, search } = req.query;

    try {
        let sql = "SELECT * FROM Game WHERE 1=1";
        const params = [];

        if (player) {
            sql += " AND player >= ?";
            params.push(player);
        }

        if (type) {
            sql += " AND type = ?";
            params.push(type);
        }

        if (search) {
            sql += " AND name LIKE ?";
            params.push(`%${search}%`);
        }

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
   
};

async function autoClearExpiredTables() {
  const conn = await db.getConnection();

  try {
    const [expiredTables] = await conn.query(`
      SELECT *
      FROM rentTables
      WHERE timeend IS NOT NULL
        AND timeend <= NOW()
    `);

    for (const rt of expiredTables) {
      await conn.beginTransaction();

      console.log("⏰ auto clear rentTable:", rt.id);

      const [rentGames] = await conn.query(`
        SELECT rg.id, rg.gameID, g.player
        FROM rentGame rg
        JOIN Game g ON rg.gameID = g.id
        WHERE rg.rentTablesID = ?
      `, [rt.id]);

      for (const rent of rentGames) {
        await conn.query(
          "UPDATE Game SET remain = remain + 1 WHERE id = ?",
          [rent.gameID]
        );

        await conn.query(
          "UPDATE rentTables SET remainPlayer = remainPlayer + ? WHERE id = ?",
          [rent.player, rt.id]
        );

        await conn.query(
          "DELETE FROM rentGame WHERE id = ?",
          [rent.id]
        );
      }

      await conn.query(
        "DELETE FROM rentTables WHERE id = ?",
        [rt.id]
      );

      await conn.commit();
    }

  } catch (err) {
    await conn.rollback();
    console.error("AUTO CLEAR ERROR:", err);
  } finally {
    conn.release();
  }
}
exports.autoClearExpiredTables = autoClearExpiredTables;
