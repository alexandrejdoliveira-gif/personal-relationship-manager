import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout";
import { Dashboard, Contacts, ContactDetail, Reminders, Settings } from "./pages";
import { startReminderPolling, requestNotificationPermission } from "./services/notifications";
import "./index.css";

function App() {
  useEffect(() => {
    // Request notification permission on load
    requestNotificationPermission();

    // Start polling for reminders
    startReminderPolling(60000); // Check every minute

    return () => {
      // Cleanup would go here if needed
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
