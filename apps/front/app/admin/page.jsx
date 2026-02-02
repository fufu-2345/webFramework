"use client";

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const API_BASE = 'http://localhost:5000/admin';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('tables');

    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        player: '',
        cost: '',
        remain: ''
    });

    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchData();
        handleCancel();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/${activeTab}`);
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            setDataList(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editId ? 'PUT' : 'POST';
            const endpoint = editId ? `${API_BASE}/${activeTab}/${editId}` : `${API_BASE}/${activeTab}`;

            let bodyData = {};
            if (activeTab === 'tables') {
                bodyData = { player: formData.player, cost: formData.cost };
            } else {
                bodyData = { name: formData.name, player: formData.player, remain: formData.remain };
            }

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Something went wrong');
            }

            handleCancel();
            fetchData();

            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: editId ? 'แก้ไขข้อมูลเรียบร้อย' : 'เพิ่มข้อมูลเรียบร้อย',
                timer: 1500,
                showConfirmButton: false
            });

        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message,
            });
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setFormData({
            name: item.name || '',
            player: item.player || '',
            cost: item.cost || '',
            remain: item.remain || ''
        });
    };

    const handleCancel = () => {
        setEditId(null);
        setFormData({ name: '', player: '', cost: '', remain: '' });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/${activeTab}/${id}`, {
                        method: 'DELETE',
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.error || 'Cannot delete');
                    }

                    if (editId === id) {
                        handleCancel();
                    }

                    fetchData();

                    Swal.fire(
                        'ลบเรียบร้อย!',
                        'ข้อมูลถูกลบออกจากระบบแล้ว',
                        'success'
                    );
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: err.message,
                    });
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">ระบบจัดการ Admin</h1>

                {/* --- TABS --- */}
                <div className="flex space-x-4 mb-6 border-b border-gray-300 pb-2">
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${activeTab === 'tables'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        🪑 จัดการโต๊ะ (Tables)
                    </button>
                    <button
                        onClick={() => setActiveTab('games')}
                        className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${activeTab === 'games'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        🎮 จัดการเกม (Games)
                    </button>
                </div>

                {/* --- FORM SECTION --- */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">
                        {editId ? '✏️ แก้ไขข้อมูล' : '➕ เพิ่มข้อมูลใหม่'} ({activeTab === 'tables' ? 'โต๊ะ' : 'เกม'})
                    </h2>
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">

                        {/* Input สำหรับ Game: ชื่อเกม */}
                        {activeTab === 'games' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเกม</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="เช่น Catan"
                                    className="border border-gray-300 rounded px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        )}

                        {/* Input ร่วม: จำนวนผู้เล่น */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {activeTab === 'tables' ? 'จำนวนผู้เล่น' : 'จำนวนผู้เล่นแนะนำ'}
                            </label>
                            <input
                                type="number"
                                name="player"
                                value={formData.player}
                                onChange={handleChange}
                                required
                                className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Input สำหรับ Table: ราคา */}
                        {activeTab === 'tables' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ราคา/ชั่วโมง</label>
                                <input
                                    type="number"
                                    name="cost"
                                    value={formData.cost}
                                    onChange={handleChange}
                                    required
                                    className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* Input สำหรับ Game: จำนวนคงเหลือ */}
                        {activeTab === 'games' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคงเหลือ (กล่อง)</label>
                                <input
                                    type="number"
                                    name="remain"
                                    value={formData.remain}
                                    onChange={handleChange}
                                    required
                                    className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`px-4 py-2 rounded text-white font-medium shadow-sm transition-transform active:scale-95 ${editId
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : (activeTab === 'tables' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700')
                                }`}
                        >
                            {editId ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
                        </button>

                        {editId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
                            >
                                ยกเลิก
                            </button>
                        )}
                    </form>
                </div>

                {/* --- DATA LIST SECTION --- */}
                {loading ? (
                    <div className="text-center p-8 text-gray-500">กำลังโหลดข้อมูล...</div>
                ) : error ? (
                    <div className="text-center p-8 text-red-500">Error: {error}</div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    {activeTab === 'games' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อเกม</th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้เล่น (คน)</th>
                                    {activeTab === 'tables' ? (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา (บาท)</th>
                                    ) : (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คงเหลือ (กล่อง)</th>
                                    )}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dataList.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{item.id}</td>

                                        {activeTab === 'games' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        )}

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.player}</td>

                                        {activeTab === 'tables' ? (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-green-600">{item.cost}</td>
                                        ) : (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.remain > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.remain}
                                                </span>
                                            </td>
                                        )}

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold"
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900 font-semibold"
                                            >
                                                ลบ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {dataList.length === 0 && (
                                    <tr>
                                        <td colSpan={activeTab === 'tables' ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                                            ยังไม่มีข้อมูล {activeTab === 'tables' ? 'โต๊ะ' : 'เกม'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}