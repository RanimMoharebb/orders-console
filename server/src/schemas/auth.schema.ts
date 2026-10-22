import { z } from "zod";

export const loginSchema = z
.object({
email: z.string().optional(),
password: z.string().optional(),
})
.superRefine((data, ctx) => {
const email = data.email?.trim() ?? "";
const password = data.password ?? "";

if (!email && !password) {
  ctx.addIssue({
    code: "custom",
    path: ["email"],
    message: "Email and password are required.",
  });

  return;
}

if (!email) {
  ctx.addIssue({
    code: "custom",
    path: ["email"],
    message: "Email is required.",
  });
} else if (!z.email().safeParse(email).success) {
  ctx.addIssue({
    code: "custom",
    path: ["email"],
    message: "Invalid email format.",
  });
}

if (!password) {
  ctx.addIssue({
    code: "custom",
    path: ["password"],
    message: "Password is required.",
  });
}

})
.transform((data) => ({
email: data.email!.trim(),
password: data.password!,
}));

export type LoginInput = z.infer<typeof loginSchema>;
