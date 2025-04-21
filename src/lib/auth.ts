// Types for better TypeScript support
type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthResponse = {
  user: User;
  token: string;
};

// Mock database (replace with real DB calls)
const users: User[] = [
  {
    id: "1",
    email: "user@example.com",
    name: "Demo User",
  },
];

// Real implementation functions
export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  // 1. Validate credentials
  // (In production, use proper password hashing like bcrypt)
  const user = users.find((u) => u.email === credentials.email);
  if (!user || credentials.password !== "password123") {
    throw new Error("Invalid email or password");
  }

  // 2. Generate token (use JWT in production)
  const token = `valid-token-${user.id}`;

  return { user, token };
}

export async function verifyAuthToken(token: string): Promise<User> {
  // 3. Verify token (use JWT verify in production)
  if (!token.startsWith("valid-token-")) {
    throw new Error("Invalid token");
  }

  const userId = token.replace("valid-token-", "");
  const user = users.find((u) => u.id === userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export function setAuthCookie(token: string) {
  document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24}`;
}

export function clearAuthCookie() {
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
