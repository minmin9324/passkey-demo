import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { NextApiRequest, NextApiResponse } from "next";

const rpID = "passkey-demo-flax.vercel.app"; // 실제 배포 환경에서는 도메인 이름

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { passkeys } = req.body;

  console.log("passkeys", passkeys);

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: passkeys
      ? passkeys.map((id: string) => ({
          type: "public-key",
          id,
        }))
      : [],
  });

  return res.status(200).json({
    challenge: options.challenge,
    allowCredentials: options.allowCredentials,
    timeout: options.timeout,
    userVerification: options.userVerification,
  });
}
