import { useState, useRef, useCallback } from "react";

const MESSAGES = [
  "Hi, ich bin Clarity.",
  "Ich begleite dich kurz durch ein paar Fragen, damit du klarer siehst, was gerade wirklich wichtig für dich ist.",
  "Das dauert etwa 10 Minuten.",
  "Antworte einfach so ehrlich, wie es sich für dich richtig anfühlt – daraus entsteht am Ende dein persönliches Klarheitsprofil.",
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useIntroSequence() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [done,     setDone]     = useState(false);
  const hasStarted = useRef(false);

  const start = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    for (let i = 0; i < MESSAGES.length; i++) {
      const text    = MESSAGES[i];
      const isFinal = i === MESSAGES.length - 1;
      const typing  = isFinal ? 1000 : rand(700, 1200);

      setIsTyping(true);
      await delay(typing);
      setIsTyping(false);

      setMessages(prev => [...prev, text]);

      if (!isFinal) {
        await delay(rand(500, 900));
      }
    }

    setDone(true);
  }, []);

  return { messages, isTyping, done, start };
}
