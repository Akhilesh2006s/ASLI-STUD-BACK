import { pgTable, serial, varchar, text, integer, timestamp, json, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('student'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  videoUrl: varchar('video_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  duration: integer('duration').notNull(), // in seconds
  subjectId: varchar('subject_id', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull().default('beginner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const learningPaths = pgTable('learning_paths', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  subjectIds: json('subject_ids').$type<string[]>().notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull().default('beginner'),
  estimatedHours: integer('estimated_hours').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  questions: json('questions').$type<any[]>().notNull(),
  subjectIds: json('subject_ids').$type<string[]>().notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull().default('beginner'),
  duration: integer('duration').notNull(), // in minutes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  videoId: integer('video_id').references(() => videos.id),
  assessmentId: integer('assessment_id').references(() => assessments.id),
  learningPathId: integer('learning_path_id').references(() => learningPaths.id),
  completed: boolean('completed').default(false).notNull(),
  score: integer('score'),
  timeSpent: integer('time_spent'), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull()
});

