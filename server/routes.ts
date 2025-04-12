import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertBugNoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const api = express.Router();
  app.use("/api", api);

  // Users routes
  api.get("/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  api.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Projects routes
  api.get("/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  api.get("/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  api.post("/projects", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validateResult = insertProjectSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ 
          error: "Invalid project data", 
          details: validateResult.error.format() 
        });
      }
      
      const project = await storage.createProject(validateResult.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  api.put("/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      // Partial validation for update
      const validateResult = insertProjectSchema.partial().safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ 
          error: "Invalid project data", 
          details: validateResult.error.format() 
        });
      }
      
      const updatedProject = await storage.updateProject(id, validateResult.data);
      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  api.delete("/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Tasks routes
  api.get("/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const tasks = await storage.getTasks(projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  api.post("/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Validate the task data but exclude project_id which we'll add ourselves
      const taskSchema = z.object({
        date: z.string(),
        tache: z.string(),
        responsable: z.number().nullable(),
        priorite: z.enum(['basse', 'moyenne', 'haute']),
        heures_estimees: z.number(),
        heures_realisees: z.number().optional().default(0),
        etat: z.enum(['réalisé', 'non réalisé'])
      });
      
      const validateResult = taskSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ 
          error: "Invalid task data", 
          details: validateResult.error.format() 
        });
      }
      
      const task = await storage.createTask(projectId, validateResult.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  api.put("/projects/:projectId/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const taskId = parseInt(req.params.taskId);
      
      if (isNaN(projectId) || isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid project ID or task ID" });
      }
      
      // Validate with a partial schema for updates
      const taskUpdateSchema = z.object({
        date: z.string().optional(),
        tache: z.string().optional(),
        responsable: z.number().nullable().optional(),
        priorite: z.enum(['basse', 'moyenne', 'haute']).optional(),
        heures_estimees: z.number().optional(),
        heures_realisees: z.number().optional(),
        etat: z.enum(['réalisé', 'non réalisé']).optional()
      });
      
      const validateResult = taskUpdateSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ 
          error: "Invalid task data", 
          details: validateResult.error.format() 
        });
      }
      
      const updatedTask = await storage.updateTask(projectId, taskId, validateResult.data);
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  api.delete("/projects/:projectId/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const taskId = parseInt(req.params.taskId);
      
      if (isNaN(projectId) || isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid project ID or task ID" });
      }
      
      const success = await storage.deleteTask(projectId, taskId);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });
  
  // Bugs and Notes routes
  api.get("/projects/:projectId/bugs-notes", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const bugsNotes = await storage.getBugsNotes(projectId);
      res.json(bugsNotes);
    } catch (error) {
      console.error("Error fetching bugs/notes:", error);
      res.status(500).json({ error: "Failed to fetch bugs/notes" });
    }
  });

  api.post("/projects/:projectId/bugs-notes", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Validate the bug/note data
      const bugNoteSchema = z.object({
        date: z.string(),
        type: z.enum(['bug', 'note']),
        contenu: z.string(),
        tache_id: z.number().nullable()
      });
      
      const validateResult = bugNoteSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ 
          error: "Invalid bug/note data", 
          details: validateResult.error.format() 
        });
      }
      
      const bugNote = await storage.createBugNote(projectId, validateResult.data);
      res.status(201).json(bugNote);
    } catch (error) {
      console.error("Error creating bug/note:", error);
      res.status(500).json({ error: "Failed to create bug/note" });
    }
  });

  api.put("/projects/:projectId/bugs-notes/:bugNoteId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const bugNoteId = parseInt(req.params.bugNoteId);
      
      if (isNaN(projectId) || isNaN(bugNoteId)) {
        return res.status(400).json({ error: "Invalid project ID or bug/note ID" });
      }
      
      // Validate with a partial schema for updates
      const bugNoteUpdateSchema = z.object({
        date: z.string().optional(),
        type: z.enum(['bug', 'note']).optional(),
        contenu: z.string().optional(),
        tache_id: z.number().nullable().optional()
      });
      
      const validateResult = bugNoteUpdateSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ 
          error: "Invalid bug/note data", 
          details: validateResult.error.format() 
        });
      }
      
      const updatedBugNote = await storage.updateBugNote(projectId, bugNoteId, validateResult.data);
      if (!updatedBugNote) {
        return res.status(404).json({ error: "Bug/note not found" });
      }
      
      res.json(updatedBugNote);
    } catch (error) {
      console.error("Error updating bug/note:", error);
      res.status(500).json({ error: "Failed to update bug/note" });
    }
  });

  api.delete("/projects/:projectId/bugs-notes/:bugNoteId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const bugNoteId = parseInt(req.params.bugNoteId);
      
      if (isNaN(projectId) || isNaN(bugNoteId)) {
        return res.status(400).json({ error: "Invalid project ID or bug/note ID" });
      }
      
      const success = await storage.deleteBugNote(projectId, bugNoteId);
      if (!success) {
        return res.status(404).json({ error: "Bug/note not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting bug/note:", error);
      res.status(500).json({ error: "Failed to delete bug/note" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
