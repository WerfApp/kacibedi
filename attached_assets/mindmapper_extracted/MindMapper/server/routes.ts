import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertEmailSchema } from "@shared/schema";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Email registration route
  app.post("/api/auth/email", async (req, res) => {
    try {
      const data = insertEmailSchema.parse(req.body);
      
      // Check if email already exists
      const existingEmail = await storage.getEmailByAddress(data.email);
      if (existingEmail) {
        return res.json({ success: true, message: "Email already registered" });
      }
      
      const email = await storage.createEmail(data);
      console.log("Email registered:", email.email, "via", email.authMethod);
      res.json({ success: true, email: email.email, message: "Email registered successfully" });
    } catch (error) {
      console.error("Email registration error:", error);
      res.status(400).json({ success: false, error: "Failed to register email" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
