import { signIn } from "next-auth/react";
import { useState } from "react";

const LoginButton = () => {
  const [username, setUsername] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const handleLogin = async () => {
    if (!username) {
      setMessage("유저이름을 입력해주세요");
      return;
    }
    const result = await signIn("credentials", {
      redirect: false,
      username,
      password: 123,
    });

    if (result?.ok) {
      console.log("로그인 성공");
      setMessage("로그인 성공");
    } else {
      console.error("로그인 실패");
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div>
          <label>유저이름</label>
          <input
            className="border-2 border-gray-300 rounded"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <button
          className=" bg-amber-300 rounded px-3 py-2"
          onClick={handleLogin}
        >
          로그인
        </button>
      </div>
      <p className=" text-yellow-600">{message}</p>
    </>
  );
};

export default LoginButton;
