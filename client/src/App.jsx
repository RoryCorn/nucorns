import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { AppearanceProvider, useAppearance } from "./lib/AppearanceContext";
import ConversationPage from "./pages/ConversationPage";
import ProfilePage from "./pages/ProfilePage";
import SignUpPage from "./pages/SignUpPage";
import WritePage from "./pages/WritePage";
import AdvertisingPage from "./pages/AdvertisingPage";
import CreativeSubmitPage from "./pages/CreativeSubmitPage";
import MessagesPage from "./pages/MessagesPage";
import GroupPage from "./pages/GroupPage";
import PrivacyPage from "./pages/PrivacyPage";
import SettingsPage from "./pages/SettingsPage";
import HomePage from "./pages/HomePage";

function Themed({ children }) {
  const { rootProps } = useAppearance();
  return <div {...rootProps}>{children}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <Themed>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/welcome" element={<SignUpPage />} />
              <Route path="/write" element={<WritePage />} />
              <Route path="/post/:id" element={<ConversationPage />} />
              <Route path="/u/:handle" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:handle" element={<MessagesPage />} />
              <Route path="/g/:slug" element={<GroupPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/advertising" element={<AdvertisingPage />} />
              <Route path="/advertise/creative/:token" element={<CreativeSubmitPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </Themed>
      </AppearanceProvider>
    </AuthProvider>
  );
}
