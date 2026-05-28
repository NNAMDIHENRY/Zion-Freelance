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
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false)
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name is too long"),
    email: z.string().trim().email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms and Privacy Policy" })
    }),
    role: z
      .nativeEnum(Role)
      .refine((r) => r === Role.CLIENT || r === Role.FREELANCER, {
        message: "Choose Client or Freelancer"
      }),
    categorySlugs: z.array(z.string()).max(8).optional(),
    skillIds: z.array(z.string()).max(24).optional(),
    country: z.string().trim().min(2, "Select your country").max(64),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(24, "Phone number is too long")
      .regex(/^[\d\s+().-]+$/, "Enter a valid phone number"),
    city: z.string().trim().min(2, "Enter your city").max(80),
    referralSource: z.string().trim().min(2, "Tell us how you heard about us").max(120),
    receiveEmailUpdates: z.boolean().optional().default(true)
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"]
      });
    }
    if (data.role !== Role.FREELANCER) return;
    if (!data.skillIds?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one skill",
        path: ["skillIds"]
      });
    }
    if (!data.categorySlugs?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one category",
        path: ["categorySlugs"]
      });
    }
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
