"use client";
// import DatePicker from "react-datepicker";
import LoginPage from "./login/page.jsx";
import "react-datepicker/dist/react-datepicker.css";
export default function Home() {
  return (
    <div>
      <LoginPage />
    </div>

    // หน้านี้น่าจะเป็นหน้า login แล้วค่อย redirectไปต่อ ที่book
  );
}
