import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Clean these because they have strict formats (URL/Email)
  MONGO_URI: z.string().trim().pipe(z.url()),
  EMAIL_SENDER: z.string().trim().pipe(z.email()),
  ORIGIN_APP: z.string().trim().pipe(z.url()),

  // Keep these raw (Secrets must be exact)
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
  ORIGIN_APP,
} = result.data;
