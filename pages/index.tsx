import { useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import LoginButton from "@/components/login";
import { useSession } from "next-auth/react";

const Home = () => {
  const [message, setMessage] = useState<string>("");
  const { update } = useSession();

  const handleRegister = async () => {
    try {
      // 서버에서 등록 옵션 가져오기
      const optionsResponse = await fetch("/api/registration-options");
      const options = await optionsResponse.json();
      console.log("origin", options.challenge);
      await update({
        challenge: options.challenge,
      });

      // SimpleWebAuthn으로 등록 시작

      const attestationResponse = await startRegistration({
        optionsJSON: options,
      }).catch((error) => {
        console.error(error);
        setMessage(`오류 발생: ${(error as { message: string }).message}`);
      });

      // 서버에 등록 응답 전송
      const verificationResponse = await fetch("/api/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestationResponse),
      });

      console.log({ verificationResponse });

      const verificationResult = await verificationResponse.json();
      console.log(verificationResult);
      if (verificationResult.success) {
        setMessage("Passkey 등록 성공!");
        localStorage.setItem("publicKey", verificationResult.publicKey);
      } else {
        setMessage("Passkey 등록 실패");
      }
    } catch (error) {
      setMessage(`오류 발생: ${(error as { message: string }).message}`);
    }
  };

  return (
    <>
      <LoginButton />
      ===================
      <div className="">
        <button
          className=" bg-red-200 rounded px-3 py-2"
          onClick={handleRegister}
        >
          Passkey 등록하기
        </button>
        <p className="text-yellow-600">{message}</p>
      </div>
      ===================
      <PasskeyList />
      ===================
      <LoginWithPasskey />
    </>
  );
};

export default Home;

const PasskeyList = () => {
  const [passkey, setPasskey] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { data } = useSession();

  const getPasskeys = async () => {
    try {
      if (!data?.challenge) {
        console.log("challenge is null");
        return;
      }
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge: base64urlToUint8Array(data.challenge),
          allowCredentials: [], // 특정 Passkey 제한 없음 (전체 Passkey 목록 가져오기)
          timeout: 60000, // 타임아웃 설정
          userVerification: "preferred", // "required" | "preferred" | "discouraged"
        };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (credential) {
        console.log(credential);
        setPasskey(credential.id);
      }
    } catch (err) {
      console.error(err);
      setError("Passkey 목록을 가져오는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <h1>브라우저에 저장된 Passkey 목록에서 passkey 조회</h1>
      <button className=" bg-red-200 rounded px-3 py-2" onClick={getPasskeys}>
        Passkey 가져오기
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>{passkey && <li>{passkey}</li>}</ul>
    </div>
  );
};

const LoginWithPasskey = () => {
  const [message, setMessage] = useState<string>("");
  const { update } = useSession();

  const handleLogin = async () => {
    try {
      setMessage("로그인 시도 중...");

      const response = await fetch("/api/generate-authentication-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const options = await response.json();

      console.log({ options });
      // `challenge`를 Uint8Array로 변환
      await update({
        challenge: options.challenge,
      });

      const authenticationResponse = await startAuthentication({
        optionsJSON: {
          challenge: options.challenge,
          userVerification: "preferred",
          allowCredentials: options.allowCredentials,
        },
      });

      console.log({ authenticationResponse });

      // 서버로 인증 응답 전송
      const publicKey = localStorage.getItem("publicKey");

      const verificationResponse = await fetch("/api/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawId: authenticationResponse.rawId,
          response: authenticationResponse.response,
          challenge: options.challenge, // 서버에서 받은 challenge
          publicKey, // 클라이언트가 보관한 공개 키
          counter: 0, // 클라이언트가 보관한 counter
        }),
      });

      const result = await verificationResponse.json();

      if (result.success) {
        setMessage("로그인 성공!");
      } else {
        setMessage("로그인 실패: " + result.message);
      }
    } catch (error) {
      console.error(error);
      setMessage(`오류 발생: ${(error as { message: string }).message}`);
    }
  };

  return (
    <div>
      <h1>Passkey로 로그인</h1>
      <button className=" bg-red-200 rounded px-3 py-2" onClick={handleLogin}>
        로그인
      </button>
      <p className=" text-yellow-600">{message}</p>
    </div>
  );
};

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
