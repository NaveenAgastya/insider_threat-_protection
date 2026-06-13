
const API_URL = import.meta.env.VITE_API_URL;

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getIncidents() {
  const res = await fetch(`${API_URL}/incidents`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function getUser(userId: string) {
  const res = await fetch(`${API_URL}/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function getUserActivities(userId: string) {
  const res = await fetch(`${API_URL}/user/${userId}/activities`);

  if (!res.ok) {
    throw new Error("Failed to fetch user activities");
  }

  return res.json();
}