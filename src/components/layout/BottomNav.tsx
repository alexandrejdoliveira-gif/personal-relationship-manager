import { NavLink } from "react-router-dom";
import { Home, Users, Bell, Settings } from "lucide-react";

const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/contacts", icon: Users, label: "Contacts" },
    { to: "/reminders", icon: Bell, label: "Reminders" },
    { to: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-items">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <item.icon size={24} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
