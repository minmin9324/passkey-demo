import {
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const rpID = "passkey-demo-flax.vercel.app"; // Relying Party ID
const rpOrigin = `https://${rpID}`; // Origin (HTTPS 환경에서 동작)

// 서버에서 생성한 challenge를 세션에 저장한다고 가정

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.challenge) {
    return res.status(401).json({ error: " Challenge missing" });
  }

  try {
    // 1. 클라이언트에서 전달된 데이터 추출
    console.log(req.body);
    const { rawId, challenge, publicKey, counter, response } = req.body;

    if (!challenge || !rawId || !publicKey) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });
    }

    // // 3. Passkey 정보 구성
    const credential = {
      publicKey: base64urlToUint8Array(publicKey),
      counter,
      id: rawId,
    };

    const verification = await verifyAuthenticationResponse({
      response: {
        id: rawId,
        rawId: rawId,
        response: response,
        type: "public-key",
      } as VerifyAuthenticationResponseOpts["response"],
      expectedChallenge: challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      credential,
    }).catch((error) => {
      console.log({ error });
      return { verified: false };
    });

    if (!verification.verified) {
      return res
        .status(400)
        .json({ success: false, message: "Authentication failed" });
    }

    // 5. 검증 성공 시 응답
    res.status(200).json({ success: true, userID: "Detected from Passkey" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "adf" });
  }
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
