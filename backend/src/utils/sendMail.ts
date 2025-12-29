import resend from "../configs/resend.js";
import { EMAIL_SENDER, NODE_ENV } from "../constants/env.js";

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
};

const getFromEmail = () =>
  NODE_ENV === "development" ? "Acme <onboarding@resend.dev>" : EMAIL_SENDER;
const getToEmail = (to: string | string[]) =>
  NODE_ENV === "development" ? ["delivered@resend.dev"] : to;

async function sendMail({ to, subject, text, html }: Params) {
  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: getToEmail(to),
    subject,
    text,
    html,
  });

  return { error, data };
}

export default sendMail;
