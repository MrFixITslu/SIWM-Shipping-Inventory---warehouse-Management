// src/layouts/NavigationLayout.tsx
import React from "react";
import { Outlet, Link } from "react-router-dom";

const NavigationLayout: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: "200px",
          background: "#f5f5f5",
          padding: "1rem",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Inventory App</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/inventory">Inventory</Link></li>
          <li><Link to="/procurement">Procurement</Link></li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: "1rem" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default NavigationLayout;
