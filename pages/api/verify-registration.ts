import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";
import { getServerSession } from "next-auth";

const rpID = "localhost"; // 실제 배포 환경에서는 도메인 이름으로 설정
const origin = `http://${rpID}:3000`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body } = req;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.challenge) {
    return res.status(401).json({ error: "Unauthorized or Challenge missing" });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: session.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (
      verification.verified &&
      verification.registrationInfo?.credential.publicKey
    ) {
      return res.status(200).json({
        success: true,
        id: verification.registrationInfo.credential.id,
        publicKey: uint8ArrayToBase64url(
          verification.registrationInfo?.credential.publicKey
        ),
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Verification failed" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: (error as { message: string }).message });
  }
}

function uint8ArrayToBase64url(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array)); // Uint8Array를 Base64로 변환
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); // Base64 → Base64URL
}
