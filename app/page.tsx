"use client";

import { useState } from "react";

export default function Home() {
  const [guess, setGuess] = useState("");
  const [answer] = useState(Math.floor(Math.random() * 10) + 1);
  const [message, setMessage] = useState("");

  const checkAnswer = () => {
    if (parseInt(guess) === answer) {
      setMessage("정답입니다!");
    } else {
      setMessage("틀렸어요! 다시 시도해보세요.");
    }
  };

  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">숫자 맞추기 게임</h1>
      <input
        type="number"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={checkAnswer}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        확인
      </button>
      <p className="mt-4">{message}</p>
    </main>
  );
}
