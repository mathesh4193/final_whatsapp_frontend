import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

const useStatusStore = create((set, get) => ({
  // State
  statuses: [],
  loading: false,
  error: null,

  // Actions
  setStatuses: (statuses) => set({ statuses }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Initialize socket listeners
  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    // Real-time event listeners
    socket.on("new_status", (newStatus) => {
      console.log("Received new_status:", newStatus);
      set((state) => {
        const safeStatuses = Array.isArray(state.statuses) ? state.statuses : [];
        return {
          statuses: safeStatuses.some((s) => s._id === newStatus._id)
            ? safeStatuses
            : [newStatus, ...safeStatuses],
        };
      });
    });

    socket.on("status_deleted", (statusId) => {
      console.log("Received status_deleted:", statusId);
      set((state) => ({
        statuses: (Array.isArray(state.statuses) ? state.statuses : []).filter((s) => s._id !== statusId),
      }));
    });

    socket.on("status_viewed", ({ statusId, viewers }) => {
      console.log("Received status_viewed:", { statusId, viewers });
      set((state) => ({
        statuses: (Array.isArray(state.statuses) ? state.statuses : []).map((status) =>
          status._id === statusId ? { ...status, viewers } : status
        ),
      }));
    });
  },

  // Cleanup socket listeners
  cleanupSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off("new_status");
      socket.off("status_deleted");
      socket.off("status_viewed");
    }
  },

  // Fetch all statuses
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/status");
      set({ statuses: data.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching statuses:", error);
      set({ error: error.message, loading: false });
    }
  },

  // Create new status
  createStatus: async (statusData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      // ✅ FIXED: Use "file" instead of "media" to match backend
      if (statusData.file) {
        formData.append("media", statusData.file);
      }
      if (statusData.content?.trim()) {
        formData.append("content", statusData.content);
      }

      const { data } = await axiosInstance.post("/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add to local state immediately for instant update
      if (data.data) {
        set((state) => {
          const safeStatuses = Array.isArray(state.statuses) ? state.statuses : [];
          return {
            statuses: safeStatuses.some((s) => s._id === data.data._id)
              ? safeStatuses
              : [data.data, ...safeStatuses],
            loading: false,
          };
        });
      }

      return data.data;
    } catch (error) {
      console.error("Error creating status:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // View status
  viewStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.put(`/status/${statusId}/view`);
    } catch (error) {
      console.error("Error viewing status:", error);
      set({ error: error.message ,loading:false});
    }
  },

  // Delete status
  deleteStatus: async (statusId) => {
    try {
      await axiosInstance.delete(`/status/${statusId}`);

      // Remove from local state immediately
      set((state) => ({
        statuses: (Array.isArray(state.statuses) ? state.statuses : []).filter((s) => s._id !== statusId),
      }));
    } catch (error) {
      console.error("Error deleting status:", error);
      set({ error: error.message });
      throw error;
    }
  },

  // Get status viewers
  getStatusViewers: async (statusId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axiosInstance.get(`/status/${statusId}/viewers`);
      return data.data;
    } catch (error) {
      console.error("Error getting status viewers:", error);
      set({ error: error.message,loading:false });
      throw error;
    }
  },

  // Helper functions for grouped statuses
  getGroupedStatuses: (userId) => {
    const { statuses } = get();
    // ✅ Ensure statuses is always an array before calling reduce
    const safeStatuses = Array.isArray(statuses) ? statuses : [];
    
    return safeStatuses.reduce((acc, status) => {
      // ✅ Handle case where user is just an ID (not populated)
      if (!status?.user) return acc;
      
      const userObj = typeof status.user === 'object' ? status.user : { _id: status.user };
      const statusUserId = userObj._id;
      
      if (!statusUserId) return acc;
      
      if (!acc[statusUserId]) {
        acc[statusUserId] = {
          id: statusUserId,
          name: userObj.username || "Unknown User",
          avatar: userObj.profilePicture,
          statuses: [],
        };
      }
      acc[statusUserId].statuses.push({
        id: status._id,
        media: status.content,
        contentType: status.contentType,
        timestamp: status.createdAt,
        viewers: status.viewers || [],
      });
      return acc;
    }, {});
  },

  getUserStatuses: (userId) => {
    const groupedStatuses = get().getGroupedStatuses(userId);
    return userId ? groupedStatuses[userId] : null;
  },

  getOtherStatuses: (userId) => {
    const groupedStatuses = get().getGroupedStatuses(userId);
    return Object.values(groupedStatuses).filter(
      (contact) => contact.id !== userId
    );
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      statuses: [],
      loading: false,
      error: null,
    }),
}));

export default useStatusStore;
