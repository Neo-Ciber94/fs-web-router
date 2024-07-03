import { useCallback, useEffect, useState } from "react";

type TypewriterProps = {
  delayMs?: number;
  content: string;
};

export default function Typewriter({ content, delayMs = 100 }: TypewriterProps) {
  const [letters, setLetters] = useState<string>("");
  const nextLetter = letters.length === content.length ? null : content[letters.length];
  const isTyping = useDebounce(nextLetter != null, 3000);
  const isDone = nextLetter == null;
  const [isBlinking, setIsBlinking] = useState(true);

  const handleTick = useCallback(() => {
    if (!isDone) {
      return;
    }

    setIsBlinking((x) => !x);
  }, [isDone]);

  useTick(500, handleTick);

  useEffect(() => {
    if (nextLetter == null) {
      return;
    }

    const interval = setInterval(() => {
      setLetters((prev) => prev + nextLetter);
    }, delayMs);

    return () => {
      clearInterval(interval);
    };
  }, [delayMs, letters, content]);

  return (
    <span>
      {letters}
      {isTyping && (
        <span className={`text-cyan-400 pl-0.5 ${isBlinking ? "visible" : "invisible"}`}>|</span>
      )}
    </span>
  );
}

function useTick(delayMs: number, onTick: () => void) {
  useEffect(() => {
    const interval = setInterval(onTick, delayMs);

    return () => {
      clearInterval(interval);
    };
  }, [delayMs, onTick]);
}

function useDebounce<T>(value: T, delayMs: number) {
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrent(value);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delayMs]);

  return current;
}
