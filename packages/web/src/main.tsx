import { createRoot } from "react-dom/client";
import App from "./App";
import { api } from "./lib/api";
import "./global.css";

window.api = api;

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
