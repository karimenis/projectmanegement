import { 
  users, projects, tasks, bugsNotes,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type BugNote, type InsertBugNote
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Complete interface for the storage
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Task operations
  getTasks(projectId: number): Promise<Task[]>;
  getTask(projectId: number, taskId: number): Promise<Task | undefined>;
  createTask(projectId: number, task: Omit<InsertTask, "project_id">): Promise<Task>;
  updateTask(projectId: number, taskId: number, task: Partial<Omit<InsertTask, "project_id">>): Promise<Task | undefined>;
  deleteTask(projectId: number, taskId: number): Promise<boolean>;
  
  // Bug/Note operations
  getBugsNotes(projectId: number): Promise<BugNote[]>;
  getBugNote(projectId: number, bugNoteId: number): Promise<BugNote | undefined>;
  createBugNote(projectId: number, bugNote: Omit<InsertBugNote, "project_id">): Promise<BugNote>;
  updateBugNote(projectId: number, bugNoteId: number, bugNote: Partial<Omit<InsertBugNote, "project_id">>): Promise<BugNote | undefined>;
  deleteBugNote(projectId: number, bugNoteId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const projectData = await db.select().from(projects).where(eq(projects.id, id));
    if (projectData.length === 0) return undefined;
    
    // Get related tasks and bugs/notes
    const projectTasks = await this.getTasks(id);
    const projectBugsNotes = await this.getBugsNotes(id);
    
    // Create a full project object with related data
    const project = {
      ...projectData[0],
      tasks: projectTasks,
      bugs_notes: projectBugsNotes
    };
    
    return project;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    const newProject = result[0];
    
    // Return with empty tasks and bugs_notes
    return {
      ...newProject,
      tasks: [],
      bugs_notes: []
    };
  }
  
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
      
    if (result.length === 0) return undefined;
    
    // Get the updated project with all relations
    return this.getProject(id);
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }
  
  // Task operations
  async getTasks(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.project_id, projectId));
  }
  
  async getTask(projectId: number, taskId: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks)
      .where(and(
        eq(tasks.project_id, projectId),
        eq(tasks.id, taskId)
      ));
    return result[0];
  }
  
  async createTask(projectId: number, task: Omit<InsertTask, "project_id">): Promise<Task> {
    const result = await db.insert(tasks)
      .values({
        ...task,
        project_id: projectId
      })
      .returning();
    return result[0];
  }
  
  async updateTask(projectId: number, taskId: number, task: Partial<Omit<InsertTask, "project_id">>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(task)
      .where(and(
        eq(tasks.project_id, projectId),
        eq(tasks.id, taskId)
      ))
      .returning();
    return result[0];
  }
  
  async deleteTask(projectId: number, taskId: number): Promise<boolean> {
    const result = await db.delete(tasks)
      .where(and(
        eq(tasks.project_id, projectId),
        eq(tasks.id, taskId)
      ))
      .returning();
    return result.length > 0;
  }
  
  // Bug/Note operations
  async getBugsNotes(projectId: number): Promise<BugNote[]> {
    return await db.select().from(bugsNotes).where(eq(bugsNotes.project_id, projectId));
  }
  
  async getBugNote(projectId: number, bugNoteId: number): Promise<BugNote | undefined> {
    const result = await db.select().from(bugsNotes)
      .where(and(
        eq(bugsNotes.project_id, projectId),
        eq(bugsNotes.id, bugNoteId)
      ));
    return result[0];
  }
  
  async createBugNote(projectId: number, bugNote: Omit<InsertBugNote, "project_id">): Promise<BugNote> {
    const result = await db.insert(bugsNotes)
      .values({
        ...bugNote,
        project_id: projectId
      })
      .returning();
    return result[0];
  }
  
  async updateBugNote(projectId: number, bugNoteId: number, bugNote: Partial<Omit<InsertBugNote, "project_id">>): Promise<BugNote | undefined> {
    const result = await db.update(bugsNotes)
      .set(bugNote)
      .where(and(
        eq(bugsNotes.project_id, projectId),
        eq(bugsNotes.id, bugNoteId)
      ))
      .returning();
    return result[0];
  }
  
  async deleteBugNote(projectId: number, bugNoteId: number): Promise<boolean> {
    const result = await db.delete(bugsNotes)
      .where(and(
        eq(bugsNotes.project_id, projectId),
        eq(bugsNotes.id, bugNoteId)
      ))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
