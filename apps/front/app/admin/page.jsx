"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../context/authContext';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const API_BASE = 'http://localhost:5000/admin';

export default function AdminPage() {
    const { user, loadingStatus, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('tables');
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editId, setEditId] = useState(null);
    const router = useRouter();

    const [dateFilter, setDateFilter] = useState(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        return {
            start: sevenDaysAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        };
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_BASE}/${activeTab}`;

            // ✅ ถ้าเป็น Tab Statistics ให้ส่งวันที่ไปด้วย
            if (activeTab === 'statistics') {
                url += `?startDate=${dateFilter.start}&endDate=${dateFilter.end}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            setDataList(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loadingStatus && !user) {

            router.push("/login");
        }

        if (user && user.role !== 'admin') {
            router.push("/book");
        }
    }, [loadingStatus, user, router]);

    const handleCancel = () => {
        setEditId(null);
        setFormData({ name: '', player: '', cost: '', remain: '', type: 'Easy' });
    };

    const [formData, setFormData] = useState({
        name: '',
        player: '',
        cost: '',
        remain: '',
        type: 'Easy'
    });

    useEffect(() => {
        setDataList([]);
        fetchData();
        handleCancel();
    }, [activeTab, dateFilter]); // ✅ เพิ่ม dateFilter ใน dependency เพื่อโหลดใหม่เมื่อเปลี่ยนวันที่

    if (loadingStatus) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }
    if (!user) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ Handle สำหรับเปลี่ยนวันที่
    const handleDateChange = (e) => {
        setDateFilter({ ...dateFilter, [e.target.name]: e.target.value });
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
                bodyData = {
                    name: formData.name,
                    player: formData.player,
                    remain: formData.remain,
                    type: formData.type
                };
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
            remain: item.remain || '',
            type: item.type || 'Easy'
        });
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

    // --- Helper Functions สำหรับ Statistics ---
    const formatTimeRange = (dateString) => {
        if (!dateString) return "-";
        const start = new Date(dateString);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const datePart = start.toLocaleDateString('th-TH');
        const startTime = start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const endTime = end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        return `${datePart} ${startTime} - ${endTime}`;
    };

    const chartData = {
        labels: dataList.map(item => item.timeStart ? formatTimeRange(item.timeStart) : '-'),
        datasets: [
            {
                label: 'รายได้รวม (Total)',
                data: dataList.map(item => item.total || 0),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'สถิติรายได้ตามช่วงเวลา' },
        },
        scales: {
            y: {
                title: { display: true, text: 'จำนวนเงิน (บาท)' },
                beginAtZero: true
            },
            x: {
                title: { display: true, text: 'วันและเวลา (ช่วง 1 ชม.)' }
            }
        }
    };

    const formatGameJson = (jsonObj) => {
        if (!jsonObj) return "-";
        try {
            const data = typeof jsonObj === 'string' ? JSON.parse(jsonObj) : jsonObj;
            return Object.entries(data)
                .map(([gameType, count]) => `${gameType}: ${count}`)
                .join(', ');
        } catch (e) {
            return "Invalid Data";
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">ระบบจัดการ Admin</h1>

                {/* --- TABS --- */}
                <div className="flex space-x-4 mb-6 border-b border-gray-300 pb-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={`px-6 py-2 rounded-t-lg font-semibold transition-colors whitespace-nowrap ${activeTab === 'tables'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        🪑 จัดการโต๊ะ (Tables)
                    </button>
                    <button
                        onClick={() => setActiveTab('games')}
                        className={`px-6 py-2 rounded-t-lg font-semibold transition-colors whitespace-nowrap ${activeTab === 'games'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        🎮 จัดการเกม (Games)
                    </button>
                    <button
                        onClick={() => setActiveTab('statistics')}
                        className={`px-6 py-2 rounded-t-lg font-semibold transition-colors whitespace-nowrap ${activeTab === 'statistics'
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        📊 ดูสถิติ (Statistics)
                    </button>
                </div>

                {/* --- CONTENT SECTION --- */}

                {activeTab === 'statistics' ? (
                    <div className="space-y-6">

                        {/* ✅ UI สำหรับเลือกช่วงเวลา */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 flex-wrap">
                            <span className="font-semibold text-gray-700">📅 กรอกช่วงเวลา:</span>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">ตั้งแต่</label>
                                <input
                                    type="date"
                                    name="start"
                                    value={dateFilter.start}
                                    onChange={handleDateChange}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">ถึง</label>
                                <input
                                    type="date"
                                    name="end"
                                    value={dateFilter.end}
                                    onChange={handleDateChange}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center p-8 text-gray-500">กำลังโหลดข้อมูลสถิติ...</div>
                        ) : error ? (
                            <div className="text-center p-8 text-red-500">Error: {error}</div>
                        ) : (
                            <>
                                {/* 1. CHART SECTION */}
                                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <Line options={chartOptions} data={chartData} />
                                </div>

                                {/* 2. TABLE SECTION */}
                                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <h3 className="text-lg font-semibold text-gray-700">ตารางข้อมูลสถิติ</h3>
                                    </div>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time Start (+1hr Shift)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total (บาท)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Game (Play Count)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {dataList.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatTimeRange(item.timeStart)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                        {item.total?.toLocaleString() || '0'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {formatGameJson(item.game)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {dataList.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                                        ไม่พบข้อมูลสถิติในช่วงเวลานี้
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    /* กรณีเป็น Tables หรือ Games */
                    <>
                        {/* FORM SECTION */}
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                            <h2 className="text-xl font-bold mb-4 text-gray-700">
                                {editId ? '✏️ แก้ไขข้อมูล' : '➕ เพิ่มข้อมูลใหม่'} ({activeTab === 'tables' ? 'โต๊ะ' : 'เกม'})
                            </h2>
                            <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">

                                {activeTab === 'games' && (
                                    <>
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Party">Party</option>
                                                <option value="Strategy">Strategy</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {activeTab === 'tables' ? 'รองรับผู้เล่น (คน)' : 'ผู้เล่นแนะนำ'}
                                    </label>
                                    <input
                                        type="number"
                                        name="player"
                                        value={formData.player}
                                        onChange={handleChange}
                                        min={1}
                                        required
                                        className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {activeTab === 'tables' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ราคา/ชั่วโมง</label>
                                        <input
                                            type="number"
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleChange}
                                            min={1}
                                            required
                                            className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                {activeTab === 'games' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">คงเหลือ (กล่อง)</label>
                                        <input
                                            type="number"
                                            name="remain"
                                            value={formData.remain}
                                            onChange={handleChange}
                                            min={1}
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

                        {/* DATA LIST SECTION */}
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
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อเกม</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                                                </>
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
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                ${item.type === 'Easy' ? 'bg-green-100 text-green-800' :
                                                                    item.type === 'Party' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-purple-100 text-purple-800'}`}>
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.player}</td>

                                                {activeTab === 'tables' ? (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-green-600">
                                                        {/* ใช้ ?. ป้องกันไว้เผื่อๆ */}
                                                        {item.cost?.toLocaleString()}
                                                    </td>
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
                                                <td colSpan={activeTab === 'tables' ? 4 : 6} className="px-6 py-8 text-center text-gray-500">
                                                    ยังไม่มีข้อมูล {activeTab === 'tables' ? 'โต๊ะ' : 'เกม'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}