"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authContext";

export default function MyTablesPage() {
  const { user, loadingStatus } = useAuth();
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);

  const router = useRouter();


  const fetchMyTables = async () => {
    try {
      setLoadingTables(true);

      const res = await fetch(
        `http://localhost:5000/tables/mytable/${user.id}`
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setTables(data);
      } else {
        setTables([]);
      }

    } catch (err) {
      console.log("Fetch Error:", err);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };


  useEffect(() => {
    if (loadingStatus) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetchMyTables();
  }, [user, loadingStatus]);


  

  if (loadingStatus) {
    return <p className="text-center mt-10">Loading user...</p>;
  }


  if (loadingTables) {
    return <p className="text-center mt-10">Loading tables...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">โต๊ะที่จองไว้</h1>

      {tables.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีการจองโต๊ะ</p>
      ) : (
        tables.map((t) => (
          <div
            key={t.rentTableId}
            className="border p-4 rounded-lg mb-4 hover:bg-gray-50"
          >
 
            <h2 className="text-xl font-semibold">
              โต๊ะ #{t.tableId}
            </h2>

            <p className="text-gray-600 mt-1">
              เวลา :{" "}
              {new Date(t.timeStart).toLocaleString("th-TH")} -{" "}
              {new Date(t.timeEnd).toLocaleString("th-TH")}
            </p>

  
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-3 mr-3"
              onClick={() =>
                router.push(`/borrow?tableId=${t.rentTableId}`)
              }
            >
              ไปหน้ายืมเกม
            </button>

        
          </div>
        ))
      )}
    </div>
  );
}
