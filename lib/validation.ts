import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  content: z.string().max(500_000).optional(),
});

export const shareDocumentSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  permission: z.enum(["view", "edit"]).default("edit"),
});

export const revokeShareSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
});

export const loginSchema = z.object({
  userId: z.string().trim().min(1),
});
