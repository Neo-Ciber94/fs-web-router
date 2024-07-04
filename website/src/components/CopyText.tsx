import { useEffect, useState } from "react";
import { MdContentCopy } from "react-icons/md";
import { FaCheck } from "react-icons/fa6";
import { cn } from "@/lib/cn";
type CopyTextProps = {
  text: string;
  className?: string;
};

export default function CopyText({ text, className }: CopyTextProps) {
  const [wasCopied, setWasCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!wasCopied) {
      return;
    }

    const timeout1 = setTimeout(() => setWasCopied(false), 2000);

    return () => {
      clearInterval(timeout1);
    };
  }, [wasCopied, showFeedback]);

  useEffect(() => {
    if (!showFeedback) {
      return;
    }

    const timeout2 = setTimeout(() => setShowFeedback(false), 1200);

    return () => {
      clearInterval(timeout2);
    };
  }, [wasCopied, showFeedback]);

  return (
    <button
      className={cn(
        "p-2 border border-neutral-500 bg-neutral-300/10 rounded-md flex flex-row justify-center items-center opacity-50 hover:opacity-100 cursor-pointer transition duration-300",
        wasCopied ? "!bg-cyan-400/60 !opacity-100" : "",
        className,
      )}
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setWasCopied(true);
            setShowFeedback(true);
          })
          .catch(console.error);
      }}
    >
      {showFeedback ? <FaCheck size={20} /> : <MdContentCopy size={20} />}
    </button>
  );
}
