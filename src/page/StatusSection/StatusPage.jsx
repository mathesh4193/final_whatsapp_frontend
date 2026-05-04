"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaEllipsisH, FaCamera } from "react-icons/fa";
import Layout from "../../components/Layout";
import StatusList from "./StatusList";
import StatusPreview from "./StatusPreview";
import formatTimestamp from "../../utils/formatTime";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/statusStore";
import ErrorBoundary from "../../components/ErrorBoundary";

export default function StatusPage() {
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  // Status store
  const {
    statuses,
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getUserStatuses,
    getOtherStatuses,
    initializeSocket,
    cleanupSocket,
    clearError,
  } = useStatusStore();

  // Get grouped statuses
  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id);

  useEffect(() => {
    fetchStatuses();
    initializeSocket();

    return () => {
      cleanupSocket();
    };
  }, [user?._id, fetchStatuses, initializeSocket, cleanupSocket]);

  // Clear error when component mounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;

    try {
      await createStatus({
        content: newStatus,
        file: selectedFile,
      });

      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModal(false);
    } catch (error) {
      // Error is handled by the store
      console.error("Failed to create status:", error);
    }
  };

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.error("Failed to view status:", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOptions(false);
      handlePreviewClose();
    } catch (error) {
      console.error("Failed to delete status:", error);
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);

    // Mark status as viewed
    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id);
    }
  };

  return (
    <ErrorBoundary>
      <Layout>
        <div
          className={`w-full min-h-screen border-r ${
            theme === "dark"
              ? "bg-[rgb(17,27,33)] border-gray-600"
              : "bg-white border-gray-200"
          } flex flex-col md:flex-row`}
        >
          {/* Status Sidebar */}
          <div
            className={`w-full md:w-1/3 border-r h-full overflow-y-auto ${
              theme === "dark" ? "border-gray-600" : "border-gray-200"
            }`}
          >
            <div
              className={`p-4 flex justify-between items-center ${
                theme === "dark" ? "text-[#d1d7db]" : "text-[#111b21]"
              }`}
            >
              <h1 className="text-xl font-bold">Status</h1>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <FaPlus className="text-xl" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <FaEllipsisH className="text-xl" />
                </button>
              </div>
            </div>

            {/* My Status */}
            <div className="p-4">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => {
                  if (userStatuses?.statuses?.length > 0) {
                    setPreviewContact(userStatuses);
                    setCurrentStatusIndex(0);
                  } else {
                    setShowCreateModal(true);
                  }
                }}
              >
                <div className="relative">
                  <img
                    src={user?.profilePicture || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.username}
                    alt="My Status"
                    className={`w-12 h-12 rounded-full object-cover border-2 ${
                      userStatuses?.statuses?.length > 0
                        ? "border-green-500 p-0.5"
                        : "border-gray-300"
                    }`}
                  />
                  {(!userStatuses || userStatuses.statuses.length === 0) && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                      <FaPlus className="text-[10px] text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      theme === "dark" ? "text-[#d1d7db]" : "text-[#111b21]"
                    }`}
                  >
                    My Status
                  </h3>
                  <p className="text-sm text-gray-500">
                    {userStatuses?.statuses?.length > 0
                      ? `Last update ${formatTimestamp(
                          userStatuses.statuses[userStatuses.statuses.length - 1]
                            .timestamp
                        )}`
                      : "Click to add status update"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Updates */}
            <div className="mt-4">
              <h2 className="px-4 py-2 text-sm font-semibold text-green-600 uppercase tracking-wider">
                Recent updates
              </h2>
              <StatusList
                statusContacts={otherStatuses}
                onSelect={(contact) => {
                  setPreviewContact(contact);
                  setCurrentStatusIndex(0);
                }}
                theme={theme}
              />
            </div>
          </div>

          {/* Status Preview Area (Empty State) */}
          <div
            className={`hidden md:flex flex-1 items-center justify-center ${
              theme === "dark" ? "bg-[#222e35]" : "bg-gray-50"
            }`}
          >
            {!previewContact && (
              <div className="text-center max-w-md p-8">
                <div className="text-6xl mb-4">📱</div>
                <h2
                  className={`text-3xl font-semibold mb-4 ${
                    theme === "dark" ? "text-[#d1d7db]" : "text-[#111b21]"
                  }`}
                >
                  Click on a status to view
                </h2>
                <p className="text-gray-500">
                  Select a contact's status from the left to see their updates.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Full Screen Status Preview */}
        <AnimatePresence>
          {previewContact && (
            <StatusPreview
              contact={previewContact}
              currentIndex={currentStatusIndex}
              onClose={() => setPreviewContact(null)}
              onNext={() => {
                if (currentStatusIndex < previewContact.statuses.length - 1) {
                  setCurrentStatusIndex(currentStatusIndex + 1);
                } else {
                  setPreviewContact(null);
                }
              }}
              onPrev={() => {
                if (currentStatusIndex > 0) {
                  setCurrentStatusIndex(currentStatusIndex - 1);
                }
              }}
              onDelete={handleDeleteStatus}
              theme={theme}
              currentUser={user}
              loading={loading}
            />
          )}
        </AnimatePresence>

        {/* Create Status Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${
                  theme === "dark" ? "bg-[#2c3338]" : "bg-white"
                }`}
              >
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                  <h3 className="text-xl font-bold">Create Status</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFilePreview(null);
                      setSelectedFile(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <FaPlus className="rotate-45" />
                  </button>
                </div>

                <div className="p-6">
                  {filePreview ? (
                    <div className="relative mb-6 group">
                      {selectedFile?.type.startsWith("video/") ? (
                        <video
                          src={filePreview}
                          className="w-full max-h-[400px] object-contain rounded-xl shadow-lg bg-black"
                          controls
                        />
                      ) : (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-full max-h-[400px] object-contain rounded-xl shadow-lg bg-black"
                        />
                      )}
                      <button
                        onClick={() => {
                          setFilePreview(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
                      >
                        <FaPlus className="rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all mb-6 group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                          <FaCamera className="text-4xl text-green-500" />
                        </div>
                        <p className="mb-2 text-sm font-semibold">
                          Click to upload image or video
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, MP4 (max. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Add a caption..."
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-gray-50 border-gray-200"
                      }`}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                  <button
                    onClick={handleCreateStatus}
                    disabled={loading || (!newStatus.trim() && !selectedFile)}
                    className="px-8 py-3 bg-green-500 text-[#111b21] rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#111b21] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaPlus className="text-sm" />
                    )}
                    Post Status
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
}
