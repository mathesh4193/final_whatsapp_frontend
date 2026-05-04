import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomeScreen from "./components/HomePage";
import UserDetails from "./components/UserDetails";
import StatusPage from "./page/StatusSection/StatusPage";
import Login from "./page/user-login/Login";
import { ProtectedRoute, PublicRoute } from './Protected';
import Settings from "./page/SettingSection/Settings";
import { useChatStore } from './store/chatStore';
import userStore from './store/useUserStore';
import { disconnectSocket, initializeSocket } from './services/chat.service';
import { checkUserAuth } from './services/user.service';

function App() {
  const { setCurrentUser, initSocketListeners, fetchConversations, cleanup } = useChatStore()
  const { user, setUser } = userStore()

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const result = await checkUserAuth();
        if (result.isAuthenticated) {
          setUser(result.user);
        }
      } catch (error) {
        console.error("Failed to refresh user auth:", error);
      }
    };

    refreshUser();
  }, [setUser]);

  useEffect(() => {
    // Initialize socket and fetch data when user is logged in
    if (user?._id) {
      const socket = initializeSocket()

      if (socket) {
        // Set current user in chat store
        setCurrentUser(user)

        // Initialize socket listeners
        initSocketListeners()

        // Fetch initial conversations
        fetchConversations()
      }
    }

    // Cleanup on unmount
    return () => {
      cleanup()
      disconnectSocket()
    }
  }, [user, setCurrentUser, initSocketListeners, fetchConversations, cleanup])
 
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/user-details" element={<UserDetails />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/setting" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
