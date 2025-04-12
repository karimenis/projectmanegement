import { pgTable, text, serial, integer, boolean, jsonb, date, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  tache: text("tache").notNull(), // French: 'task'
  responsable: integer("responsable").references(() => users.id), // French: 'user_id'
  priorite: text("priorite").notNull(), // French: 'priority', values: 'basse', 'moyenne', 'haute'
  heures_estimees: real("heures_estimees").notNull(), // French: 'hours_estimated'
  heures_realisees: real("heures_realisees").default(0).notNull(), // French: 'hours_done'
  etat: text("etat").notNull(), // French: 'status', values: 'réalisé', 'non réalisé'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  project_id: true,
  date: true,
  tache: true,
  responsable: true,
  priorite: true,
  heures_estimees: true,
  heures_realisees: true,
  etat: true,
});

// Bugs and Notes schema
export const bugsNotes = pgTable("bugs_notes", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: text("type").notNull(), // 'bug', 'note'
  contenu: text("contenu").notNull(), // French: 'content'
  tache_id: integer("tache_id").references(() => tasks.id, { onDelete: "set null" }), // French: 'task_id'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertBugNoteSchema = createInsertSchema(bugsNotes).pick({
  project_id: true,
  date: true,
  type: true,
  contenu: true,
  tache_id: true,
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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  bugsNotes: many(bugsNotes),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [tasks.responsable],
    references: [users.id],
  }),
  bugsNotes: many(bugsNotes),
}));

export const bugsNotesRelations = relations(bugsNotes, ({ one }) => ({
  project: one(projects, {
    fields: [bugsNotes.project_id],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [bugsNotes.tache_id],
    references: [tasks.id],
  }),
}));
