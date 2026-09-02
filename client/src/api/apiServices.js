import api from './client';

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demoLogin: (role) => api.post(`/auth/demo-login/${role}`),
  getMe: () => api.get('/auth/me'),
  updateProfile: (formData) => api.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.put('/auth/change-password', data),
  getMyReports: () => api.get('/auth/my-reports')
};

// Report Services
export const reportService = {
  getStats: () => api.get('/reports/stats'),
  getCategories: () => api.get('/reports/categories'),
  getReports: (params) => api.get('/reports', { params }),
  getReportById: (id) => api.get(`/reports/${id}`),
  createReport: (formData) => api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, formData) => api.put(`/reports/${id}/status`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteReport: (id) => api.delete(`/reports/${id}`),
  toggleUpvote: (id) => api.post(`/reports/${id}/upvote`),
  addComment: (id, content) => api.post(`/reports/${id}/comments`, { content }),
  flagReport: (id, data) => api.post(`/reports/${id}/flag`, data)
};

// Admin Services
export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getStaffList: () => api.get('/admin/staff'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  toggleUserBan: (userId) => api.put(`/admin/users/${userId}/ban`),
  approveUser: (userId) => api.put(`/admin/users/${userId}/approve`),
  rejectUser: (userId) => api.put(`/admin/users/${userId}/reject`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  createCategory: (data) => api.post('/admin/categories', data),
  getFlags: () => api.get('/admin/flags'),
  resolveFlag: (flagId, action) => api.post(`/admin/flags/${flagId}/resolve`, { action })
};

// Notification Services
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

// Contact Services
export const contactService = {
  sendMessage: (data) => api.post('/contact', data)
};
