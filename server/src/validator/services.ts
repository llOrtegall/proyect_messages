import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(3).max(50)
})

export const validateSchema = (dataForm: unknown ) => {
    const { success, data, error } = loginSchema.safeParse(dataForm)

    if (!success) {
        throw error.format()
    }

    return data
} 