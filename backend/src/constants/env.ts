import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGO_URI: z.string().trim().min(1),
  EMAIL_SENDER: z.string().trim().min(1),
  APP_ORIGIN: z.string().trim().min(1),

  JWT_SECRET: z.string().min(1),
  JWT_SECRET_REFRESH: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const { fieldErrors } = z.flattenError(result.error);
  console.error("❌ Environment validation failed:");

  Object.entries(fieldErrors).forEach(([field, errors]) => {
    console.error(`   • ${field.padEnd(15)} : ${errors?.join(", ")}`);
  });

  console.error("\nCheck your .env file or deployment settings.");
  process.exit(1);
}

export const {
  PORT,
  NODE_ENV,
  MONGO_URI,
  JWT_SECRET,
  JWT_SECRET_REFRESH,
  RESEND_API_KEY,
  EMAIL_SENDER,
  APP_ORIGIN,
} = result.data;
