import { Role } from "@prisma/client";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  password: passwordSchema,
  role: z
    .nativeEnum(Role)
    .refine((r) => r === Role.CLIENT || r === Role.FREELANCER, {
      message: "Choose Client or Freelancer"
    })
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset link is invalid or expired"),
  password: passwordSchema
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
