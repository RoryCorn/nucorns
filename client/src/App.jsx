import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { AppearanceProvider, useAppearance } from "./lib/AppearanceContext";
import ConversationPage from "./pages/ConversationPage";
import ProfilePage from "./pages/ProfilePage";
import SignUpPage from "./pages/SignUpPage";
import WritePage from "./pages/WritePage";
import AdvertisingPage from "./pages/AdvertisingPage";
import SettingsPage from "./pages/SettingsPage";

function Themed({ children }) {
  const { rootProps } = useAppearance();
  return <div {...rootProps}>{children}</div>;
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={`/u/${user.handle}`} replace /> : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <Themed>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/welcome" element={<SignUpPage />} />
              <Route path="/write" element={<WritePage />} />
              <Route path="/post/:id" element={<ConversationPage />} />
              <Route path="/u/:handle" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/advertising" element={<AdvertisingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </Themed>
      </AppearanceProvider>
    </AuthProvider>
  );
}
