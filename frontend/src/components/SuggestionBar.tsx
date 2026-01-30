"use client";
import Link from "next/link";
import { useAIContext } from "@/context/AiContext";

type Suggestion = {
  title: string;
  icon: string;
  href?: string;
};

const getPromptForSuggestion = (title: string): string => {
  switch (title) {
    case "Get Growth Tips":
      return "Based on my personality and recent journals, what are the top 3 growth tips you recommend for me to work on this week?";
    case "Start Dreaming":
      return "Help me explore my dreams and aspirations. What should I focus on to make my dreams a reality?";
    default:
      return `Tell me about ${title}`;
  }
};

export const SuggestionsBar = ({
  suggestions,
}: {
  suggestions: Suggestion[];
}) => {
  const { handleAskAI } = useAIContext();

  const handleSuggestionClick = (item: Suggestion) => {
    if (!item.href) {
      // If no href, trigger AI with a relevant prompt
      const prompt = getPromptForSuggestion(item.title);
      handleAskAI(prompt);
    }
  };

  return (
    <div className="overflow-x-auto w-full min-[1280px]:flex justify-center">
      <div className="flex gap-4 flex-nowrap py-2 px-1">
        {suggestions.map((item, index) => {
          if (item.href) {
            return (
              <Link 
                key={index} 
                href={item.href}
                className="min-w-[180px] bg-white/30 rounded-xl shadow-md px-4 py-2 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="font-medium text-white font-sora whitespace-nowrap tracking-tight">
                  {item.title}
                </div>
              </Link>
            );
          } else {
            return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(item)}
                className="min-w-[180px] bg-white/30 rounded-xl shadow-md px-4 py-2 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="font-medium text-white font-sora whitespace-nowrap tracking-tight">
                  {item.title}
                </div>
              </button>
            );
          }
        })}
      </div>
    </div>
  );
};
