import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaSearch } from "react-icons/fa";
import useStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import formatTimestamp from "../../utils/formatTime";
import userStore from "../../store/useUserStore";

const ChatList = ({ contacts }) => {
  const setSelectedContact = useStore((state) => state.setSelectedContact);
  const selectedContact = useStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
    const { user } = userStore();
  const [searchTerm, setSearchTerm] = useState("");
  // ✅ Ensure contacts is always an array
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  // Filter contacts based on the search term
  const filteredContacts = safeContacts
    .filter((contact) => contact?._id !== user?._id) // ❌ Filter out current user
    .filter((contact) =>
      contact?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div
      className={`w-full border-r h-screen ${
        theme === "dark"
          ? "bg-[rgb(17,27,33)] border-gray-600"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 flex justify-between items-center ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user?.profilePicture || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.username}
                alt={user?.username}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            </div>
          )}
          <h2 className="text-2xl font-bold">Chats</h2>
        </div>
        <button 
          className="p-1.5 bg-[#25D366] text-white rounded-full hover:bg-[#20bd5b] transition-colors shadow-sm"
        >
          <FaPlus className="text-lg" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-500" : "text-[#667781]"
            }`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`w-full pl-12 pr-4 py-2 border-none rounded-xl focus:outline-none ${
              theme === "dark"
                ? "bg-[#202c33] text-[#d1d7db] placeholder-[#8696a0]"
                : "bg-[#f0f2f5] text-[#111b21] placeholder-[#667781]"
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact._id}
            onClick={() => setSelectedContact(contact)}
            className={`p-3  flex items-center cursor-pointer ${
              theme === "dark"
                ? selectedContact?._id === contact._id
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
                : selectedContact?._id === contact._id
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            <img
              src={contact?.profilePicture || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + contact?.username}
              alt={contact?.username}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
            <div className="ml-4 flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2
                  className={`font-bold text-lg truncate ${
                    theme === "dark" ? "text-white" : "text-[#111B21]"
                  }`}
                >
                  {contact.username}
                </h2>
                {contact?.conversation && (
                  <span
                    className="text-xs text-gray-400 whitespace-nowrap ml-2"
                  >
                    {formatTimestamp(contact?.conversation?.lastMessage?.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <p
                  className={`text-[15px] truncate flex-1 ${
                    theme === "dark" ? "text-gray-400" : "text-[#667781]"
                  }`}
                >
                  {contact?.conversation?.lastMessage?.content}
                </p>
                {contact?.conversation &&
                  contact?.conversation?.unreadCount > 0 &&
                  contact?.conversation?.lastMessage?.receiver?._id === user?._id && (
                    <p className="text-xs font-bold w-5 h-5 flex items-center justify-center bg-[#FFB800] text-white rounded-full ml-2">
                      {contact?.conversation?.unreadCount}
                    </p>
                  )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
