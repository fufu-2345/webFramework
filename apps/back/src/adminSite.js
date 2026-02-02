const express = require('express');
const router = express.Router();
const db = require('./config/db');

// ==========================================
// 🪑 SECTION: TABLES (จัดการโต๊ะ)
// ==========================================

// 1. ดึงข้อมูลโต๊ะทั้งหมด
router.get('/tables', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Tables ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
    }
});

// 2. สร้างโต๊ะใหม่
router.post('/tables', async (req, res) => {
    const { player, cost } = req.body;
    if (!player || !cost) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    try {
        const sql = 'INSERT INTO Tables (player, cost) VALUES (?, ?)';
        const [result] = await db.execute(sql, [player, cost]);
        res.json({ id: result.insertId, player, cost, message: 'เพิ่มโต๊ะสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'เพิ่มข้อมูลไม่สำเร็จ' });
    }
});

// 3. แก้ไขข้อมูลโต๊ะ
router.put('/tables/:id', async (req, res) => {
    const { id } = req.params;
    const { player, cost } = req.body;

    try {
        const sql = 'UPDATE Tables SET player = ?, cost = ? WHERE id = ?';
        const [result] = await db.execute(sql, [player, cost, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบโต๊ะที่ต้องการแก้ไข' });
        }
        res.json({ message: 'แก้ไขข้อมูลสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'แก้ไขข้อมูลไม่สำเร็จ' });
    }
});

// 4. ลบโต๊ะ
router.delete('/tables/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = 'DELETE FROM Tables WHERE id = ?';
        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบโต๊ะที่ต้องการลบ' });
        }
        res.json({ message: 'ลบโต๊ะสำเร็จ' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'ไม่สามารถลบโต๊ะนี้ได้ เนื่องจากมีการใช้งานอยู่' });
        }
        res.status(500).json({ error: 'ลบข้อมูลไม่สำเร็จ' });
    }
});

// ==========================================
// 🎮 SECTION: GAMES (จัดการเกม)
// ==========================================

// 1. ดึงข้อมูลเกมทั้งหมด
router.get('/games', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Game ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ดึงข้อมูลเกมไม่สำเร็จ' });
    }
});

// 2. เพิ่มเกมใหม่
router.post('/games', async (req, res) => {
    const { name, player, remain, type } = req.body;

    if (!name || !player || remain === undefined || !type) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ (ชื่อ, ผู้เล่น, คงเหลือ, ประเภท)' });
    }

    try {
        const sql = 'INSERT INTO Game (name, player, remain, type) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(sql, [name, player, remain, type]);
        res.json({ id: result.insertId, name, player, remain, type, message: 'เพิ่มเกมสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'เพิ่มเกมไม่สำเร็จ' });
    }
});

// 3. แก้ไขเกม
router.put('/games/:id', async (req, res) => {
    const { id } = req.params;
    const { name, player, remain, type } = req.body;

    try {
        const sql = 'UPDATE Game SET name = ?, player = ?, remain = ?, type = ? WHERE id = ?';
        const [result] = await db.execute(sql, [name, player, remain, type, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบเกมที่ต้องการแก้ไข' });
        }
        res.json({ message: 'แก้ไขเกมสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'แก้ไขเกมไม่สำเร็จ' });
    }
});

// 4. ลบเกม
router.delete('/games/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = 'DELETE FROM Game WHERE id = ?';
        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบเกมที่ต้องการลบ' });
        }
        res.json({ message: 'ลบเกมสำเร็จ' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'ไม่สามารถลบเกมนี้ได้ เนื่องจากมีการเช่าเล่นอยู่' });
        }
        res.status(500).json({ error: 'ลบเกมไม่สำเร็จ' });
    }
});

// ==========================================
// 📊 SECTION: STATISTICS (สถิติ)
// ==========================================

// 1. ดึงข้อมูลสถิติทั้งหมด
router.get('/statistics', async (req, res) => {
    try {
        // เรียงตามเวลาล่าสุดก่อน เพื่อให้ดูกราฟง่ายขึ้น (หรือ ASC แล้วแต่ UI)
        const [rows] = await db.query('SELECT * FROM statistic ORDER BY timeStart ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ดึงข้อมูลสถิติไม่สำเร็จ' });
    }
});

module.exports = router;