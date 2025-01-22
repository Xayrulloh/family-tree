import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
})

export function validateEnv() {
    return envSchema.parse(process.env);
}