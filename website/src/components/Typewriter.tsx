import { cn } from "@/lib/cn";
import { useCallback, useEffect, useMemo, useState } from "react";

type TypewriterProps = {
  delayMs?: number;
  content: string;
  highLightWords?: string[];
};

export default function Typewriter({
  content,
  delayMs = 60,
  highLightWords = [],
}: TypewriterProps) {
  const [letters, setLetters] = useState<string>("");
  const nextLetter = letters.length === content.length ? null : content[letters.length];
  const isTyping = useDebounce(nextLetter != null, 3000);
  const isDone = nextLetter == null;
  const [isBlinking, setIsBlinking] = useState(true);
  const characters = useMemo(() => Array.from(letters), [letters]);

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
    <div>
      {characters.map((c, i) => {
        const word = findCurrentWord(content, i);
        return (
          <span
            key={i}
            className={cn(
              word &&
                highLightWords.includes(word) &&
                "font-semibold text-cyan-400 dark:text-cyan-300",
            )}
          >
            {c}
          </span>
        );
      })}
      {isTyping && (
        <span className={cn("text-cyan-400 pl-0.4", isBlinking ? "visible" : "invisible")}>|</span>
      )}
    </div>
  );
}

function findCurrentWord(content: string, index: number) {
  const nextLetter = content[index];

  if (nextLetter == null || /\s/.test(nextLetter)) {
    return null;
  }

  let startIndex = index;
  let endIndex = index;

  while (startIndex > 0) {
    const c = content[startIndex];
    if (/\s/.test(c)) {
      startIndex += 1;
      break;
    }

    startIndex -= 1;
  }

  while (endIndex < content.length) {
    const c = content[endIndex];
    if (/\s/.test(c)) {
      break;
    }

    endIndex += 1;
  }

  const word = content.slice(startIndex, endIndex);
  return word.length > 0 ? word : null;
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
