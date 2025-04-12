import { pgTable, text, serial, integer, boolean, jsonb, date, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for project participants
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  username: true,
  password: true,
  role: true,
});

// Projects schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  estimation_days: integer("estimation_days").notNull(),
  users: jsonb("users").notNull().$type<number[]>(), // Array of user IDs
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  estimation_days: true,
  users: true,
});

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  task: text("task").notNull(),
  user_id: integer("user_id").references(() => users.id),
  priority: text("priority").notNull(), // 'basse', 'moyenne', 'haute'
  hours_estimated: real("hours_estimated").notNull(),
  hours_done: real("hours_done").default(0).notNull(),
  status: text("status").notNull(), // 'réalisé', 'non réalisé'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  project_id: true,
  date: true,
  task: true,
  user_id: true,
  priority: true,
  hours_estimated: true,
  hours_done: true,
  status: true,
});

// Bugs and Notes schema
export const bugsNotes = pgTable("bugs_notes", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: text("type").notNull(), // 'bug', 'note'
  content: text("content").notNull(),
  task_id: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertBugNoteSchema = createInsertSchema(bugsNotes).pick({
  project_id: true,
  date: true,
  type: true,
  content: true,
  task_id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type BugNote = typeof bugsNotes.$inferSelect;
export type InsertBugNote = z.infer<typeof insertBugNoteSchema>;
