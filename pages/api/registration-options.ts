import { getServerSession } from "next-auth";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";

// Extend the Session type to include the challenge property
declare module "next-auth" {
  interface Session {
    challenge?: string;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userID = new TextEncoder().encode(session.user.id); // 세션에서 사용자 ID를 Uint8Array로 변환
  const userName = session.user.name || "jungmin_choi";

  const options = generateRegistrationOptions({
    rpName: "My App",
    rpID: "localhost",
    userID,
    userName,
    attestationType: "direct",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  const result = await options;
  console.log("origin server", result.challenge);

  session.challenge = result.challenge;

  console.log({ session }, 2);
  console.log({ options });

  return res.status(200).json(result);
}
