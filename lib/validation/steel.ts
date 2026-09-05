import { z } from "zod";

// Section 44: Data Validation
export const chemicalCompositionSchema = z
  .record(z.string(), z.number().min(0).max(100))
  .optional();

export const steelBaseSchema = z.object({
  name: z.string().min(1, "Tên thép không được để trống"),
  grade: z.string().min(1, "Steel Grade không được để trống"),
  code: z.string().min(1, "Steel Code không được để trống"),
  standardId: z.string().min(1, "Phải chọn Standard từ danh sách"),
  categoryId: z.string().min(1, "Phải chọn Category từ danh sách"),
  materialType: z.string().min(1),
  shape: z.string().min(1),
  country: z.string().optional(),
  description: z.string().optional(),

  yieldStrength: z.number().positive().nullable().optional(),
  tensileStrength: z.number().positive().nullable().optional(),
  elongation: z.number().min(0).max(100).nullable().optional(),
  density: z.number().positive().nullable().optional(),
  hardness: z.string().optional(),

  chemicalComposition: chemicalCompositionSchema,

  thicknessMin: z.number().nonnegative().nullable().optional(),
  thicknessMax: z.number().nonnegative().nullable().optional(),
  width: z.number().nonnegative().nullable().optional(),
  length: z.number().nonnegative().nullable().optional(),
  diameter: z.number().nonnegative().nullable().optional(),
  weight: z.number().nonnegative().nullable().optional(),

  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
});

export const steelCreateSchema = steelBaseSchema;
export const steelUpdateSchema = steelBaseSchema.partial();

export const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});
