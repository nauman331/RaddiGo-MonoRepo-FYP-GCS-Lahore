import mysql from "../config/sqldb";

export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  phone: string;
  googleId?: string;
  facebookId?: string;
  address?: string;
  profilePicture?: string;
  role: "user" | "admin" | "support";
  isVerified: boolean;
  token?: string;
  tokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const User = {
  async create (user: Omit<IUser, "id" | "createdAt" | "updatedAt">): Promise<IUser> {
    await mysql<IUser[]>`
      INSERT INTO users (username, email, password, phone, role, isVerified, token, tokenExpiry)
      VALUES (${user.username}, ${user.email}, ${user.password}, ${user.phone}, ${user.role}, ${user.isVerified}, ${user.token}, ${user.tokenExpiry})
    `;
      const [newUser] = await mysql<IUser[]>`
      SELECT * FROM users WHERE email = ${user.email}
    `;
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    return newUser;
  },
  async findById (id: number): Promise<IUser | null> {
    const [user] = await mysql<IUser[]>`
      SELECT * FROM users WHERE id = ${id}
    `;
    return user || null;
  },
  async findByEmail (email: string): Promise<IUser | null> {
    const [user] = await mysql<IUser[]>`
    SELECT * FROM users WHERE email = ${email}`;
    return user || null;
  },
  async findByPhone (phone: string): Promise<IUser | null> {
    const [user] = await mysql<IUser[]>`
    SELECT * FROM users WHERE phone = ${phone}`;
    return user || null;
  },
async updateUser (id: number, updates: Partial<IUser>): Promise<void> {
  const entries = Object.entries(updates);
  
  if (entries.length === 0) return;
  
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  
  const query = `UPDATE users SET ${setClause} WHERE id = ?`;
  
  await mysql.unsafe(query, [...values, id]);
},
  async deleteUser (id: number): Promise<void> {
    await mysql`
      DELETE FROM users WHERE id = ${id}
    `;
  }
}