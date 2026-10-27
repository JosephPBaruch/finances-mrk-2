import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/global.scss";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

createRoot(root).render(<StrictMode><App /></StrictMode>);
