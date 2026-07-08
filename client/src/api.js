const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listVendors: () => request('/vendors'),
  createVendor: (data) => request('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  getVendor: (id) => request(`/vendors/${id}`),
  updateCompany: (id, data) => request(`/vendors/${id}/company`, { method: 'PUT', body: JSON.stringify(data) }),
  updateDeal: (id, data) => request(`/vendors/${id}/deal`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id) => request(`/vendors/${id}`, { method: 'DELETE' }),
  updateReminder: (id, enabled) => request(`/vendors/${id}/reminder`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  updateArchived: (id, archived) => request(`/vendors/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
  updateStatus: (id, status) => request(`/vendors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateChecklistItem: (id, data) => request(`/checklist-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createChecklistItem: (data) => request('/checklist-items', { method: 'POST', body: JSON.stringify(data) }),
  deleteChecklistItem: (id) => request(`/checklist-items/${id}`, { method: 'DELETE' }),
};
