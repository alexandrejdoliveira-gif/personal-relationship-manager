import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell() {
    return (
        <div className="app-shell">
            <Header />
            <main className="app-main">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
