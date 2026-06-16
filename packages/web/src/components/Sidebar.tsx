import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Match History", icon: "⚔️" },
  { to: "/champions", label: "Champions", icon: "🏆" },
  { to: "/augments", label: "Augments", icon: "🎯" },
  { to: "/friends", label: "Friends", icon: "👥" },
  { to: "/global", label: "Total Stats", icon: "🌐" },
];

export default function Sidebar() {
  return (
    <nav className="w-56 bg-lol-card border-r border-lol-border flex flex-col shrink-0">
      <div className="flex flex-col items-center justify-center gap-0.5 pt-8 pb-3">
        <span className="text-lol-gold font-bold text-lg leading-tight">Political Party</span>
        <span className="text-lol-gold font-bold text-lg leading-tight">Squad-32</span>
      </div>

      <div className="flex flex-col gap-1 p-3 mt-2 flex-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-lol-gold/15 text-lol-gold"
                  : "text-lol-text hover:bg-lol-card-hover hover:text-lol-text-bright"
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="px-3 pb-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-lol-gold/15 text-lol-gold"
                : "text-lol-text hover:bg-lol-card-hover hover:text-lol-text-bright"
            }`
          }
        >
          <span>{"⚙️"}</span>
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
}
