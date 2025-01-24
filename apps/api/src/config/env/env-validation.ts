import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().length(4).transform(Number),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  COOKIES_SECRET: z.string().min(1),
})

type envType = z.infer<typeof envSchema>;

function validateEnv() {
    return envSchema.parse(process.env);
}

export { envType, validateEnv }