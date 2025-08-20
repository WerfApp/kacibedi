import { type User, type InsertUser, type Email, type InsertEmail } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email operations
  createEmail(data: InsertEmail): Promise<Email>;
  getEmailByAddress(email: string): Promise<Email | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emails: Map<string, Email>;

  constructor() {
    this.users = new Map();
    this.emails = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = randomUUID();
    const email: Email = { 
      ...insertEmail, 
      id, 
      createdAt: new Date() 
    };
    this.emails.set(insertEmail.email, email);
    return email;
  }

  async getEmailByAddress(emailAddress: string): Promise<Email | undefined> {
    return this.emails.get(emailAddress);
  }
}

export const storage = new MemStorage();
