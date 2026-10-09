// DEMO USERS — learning only. A real app stores password HASHES (bcrypt/Argon2)
// in a database, never plain-text passwords in source code.
const USERS = [
  { id: "demo-user-1", name: "Abebe", email: "abebe@example.com", password: "password123", role: "customer" },
  { id: "demo-user-2", name: "Marta", email: "marta@example.com", password: "password123", role: "customer" },
  { id: "demo-staff-1", name: "Kitchen Staff", email: "staff@example.com", password: "password123", role: "staff" },
];

export function findUserById(id) {
  return USERS.find((u) => u.id === id) ?? null;
}

export function verifyCredentials(email, password) {
  const user = USERS.find((u) => u.email === email);
  if (!user || user.password !== password) return null;
  return user;
}
