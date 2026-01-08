import { Heart } from "lucide-react";

export function Header() {
    return (
        <header className="app-header">
            <div className="app-header-content">
                <div className="app-logo">
                    <Heart size={24} />
                    <span>Personal RM</span>
                </div>
            </div>
        </header>
    );
}
