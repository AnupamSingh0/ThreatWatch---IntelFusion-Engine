import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Lookup from "./pages/Lookup";
import Feed from "./pages/Feed";
import Pulses from "./pages/Pulses";
import Correlate from "./pages/Correlate";

function Layout() {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar hover trigger */}
      <div
        onMouseEnter={() => setHovered(true)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          zIndex: 200,
        }}
      />

      {/* Sidebar */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 220,
          transform: hovered ? "translateX(0)" : "translateX(-220px)",
          transition: "transform 0.25s ease",
          zIndex: 100,
          boxShadow: hovered ? "4px 0 24px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          width: "100vw",
          marginLeft: 0,
          padding: "28px 32px",
          overflowY: "auto",
          maxHeight: "100vh",
        }}
      >
        <Routes>
          {/*  ROOT NOW = DASHBOARD */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lookup" element={<Lookup />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/pulses" element={<Pulses />} />
          <Route path="/correlate" element={<Correlate />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}