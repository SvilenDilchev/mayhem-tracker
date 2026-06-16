import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex w-full h-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
