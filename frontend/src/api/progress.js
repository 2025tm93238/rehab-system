import client from './client';

export async function getSessionProgress(sessionId) {
  const { data } = await client.get(`/sessions/${sessionId}/progress`);
  return data;
}

export async function createSessionProgress(sessionId, payload) {
  const { data } = await client.post(`/sessions/${sessionId}/progress`, payload);
  return data;
}

export async function updateSessionProgress(sessionId, payload) {
  const { data } = await client.put(`/sessions/${sessionId}/progress`, payload);
  return data;
}

export async function getPatientProgressTimeline(patientId) {
  const { data } = await client.get(`/patients/${patientId}/progress`);
  return data;
}
