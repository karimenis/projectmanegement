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
    const projectsData = await db.select().from(projects);
    
    // For each project, add empty tasks and bugs_notes arrays
    return Promise.all(projectsData.map(async (project) => {
      return await this.getProject(project.id) as Project;
    }));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const projectData = await db.select().from(projects).where(eq(projects.id, id));
    if (projectData.length === 0) return undefined;
    
    // Get related tasks and bugs/notes
    const projectTasks = await this.getTasks(id);
    const projectBugsNotes = await this.getBugsNotes(id);
    
    // Create a full project object with related data
    // We need to add tasks and bugs_notes as custom properties since 
    // they're not part of the DB schema but are needed for the API
    return {
      id: projectData[0].id,
      name: projectData[0].name,
      estimation_days: projectData[0].estimation_days,
      users: projectData[0].users,
      created_at: projectData[0].created_at,
      // Custom properties for related data
      tasks: projectTasks,
      bugs_notes: projectBugsNotes
    } as unknown as Project;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    // Ensure users is an array of numbers
    const userArray = Array.isArray(project.users) ? 
      project.users : 
      (project.users ? [project.users] : []);
    
    const projectData = {
      name: project.name,
      estimation_days: project.estimation_days,
      users: userArray
    };
    
    const result = await db.insert(projects).values(projectData).returning();
    const newProject = result[0];
    
    // Return with empty tasks and bugs_notes
    return {
      id: newProject.id,
      name: newProject.name,
      estimation_days: newProject.estimation_days,
      users: newProject.users,
      created_at: newProject.created_at,
      // Custom properties for related data
      tasks: [],
      bugs_notes: []
    } as unknown as Project;
  }
  
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    // Handle users array for update
    let projectData = { ...project };
    if (project.users) {
      const userArray = Array.isArray(project.users) ? 
        project.users : 
        (project.users ? [project.users] : []);
      
      projectData = {
        ...projectData,
        users: userArray
      };
    }
    
    const result = await db.update(projects)
      .set(projectData)
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
