import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGO_URI: z.string().trim().min(1),
  EMAIL_SENDER: z.string().trim().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_SECRET_REFRESH: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  APP_ORIGIN: z.url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const { fieldErrors } = z.flattenError(result.error);
  console.error("\n❌ Environment validation failed!\n");
  Object.entries(fieldErrors).forEach(([field, errors]) => {
    console.error(`   • ${field.padEnd(20)}: ${errors?.join(", ")}`);
  });
  process.exit(1);
}

export const {
  PORT,
  NODE_ENV,
  MONGO_URI,
  EMAIL_SENDER,
  JWT_SECRET,
  JWT_SECRET_REFRESH,
  RESEND_API_KEY,
  APP_ORIGIN,
} = result.data;
