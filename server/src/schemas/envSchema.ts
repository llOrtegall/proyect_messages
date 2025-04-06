import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  JWT_SECRET: z.string(),
  MYSQL_HOST: z.string().default("localhost"),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().default("test"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
});

const { success, data, error } = envSchema.safeParse(process.env)

if (!success) {
  console.error("Environment variables validation error:", error.format());
  process.exit(1);
}

export const {
  JWT_SECRET,
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PASSWORD,
  CLIENT_URL,
  MYSQL_PORT,
  MYSQL_USER,
  NODE_ENV,
  PORT,
} = data;