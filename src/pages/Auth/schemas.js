import { z } from "zod";

// Shared zod schemas for auth forms (Vietnamese messages).
// Async checks (username availability) stay outside the schema —
// callers apply them with RHF setError/clearErrors.

export const loginSchema = z.object({
  login: z.string().trim().min(1, "Vui lòng nhập tài khoản"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    username: z.string().trim().min(1, "Vui lòng nhập tên hiển thị"),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải tối thiểu 8 ký tự"),
    password_confirmation: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .superRefine((data, ctx) => {
    if (
      data.password_confirmation &&
      data.password_confirmation !== data.password
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["password_confirmation"],
        message: "Mật khẩu xác nhận không khớp",
      });
    }
  });

export const USERNAME_DEBOUNCE_MS = 700;
