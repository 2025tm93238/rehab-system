import client from './client';

export async function listSessions({ patientId, therapistId, status } = {}) {
  const params = {};
  if (patientId) params.patientId = patientId;
  if (therapistId) params.therapistId = therapistId;
  if (status) params.status = status;
  const { data } = await client.get('/sessions', { params });
  return data;
}

export async function getSession(id) {
  const { data } = await client.get(`/sessions/${id}`);
  return data;
}

export async function createSession(payload) {
  const { data } = await client.post('/sessions', payload);
  return data;
}

export async function updateSession(id, payload) {
  const { data } = await client.put(`/sessions/${id}`, payload);
  return data;
}
