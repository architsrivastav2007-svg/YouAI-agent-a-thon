"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { callGroqAI } from "@/lib/groqClient";
import { PersonalityScores } from "@/types/User";
import { useAppContext } from "./AppContext";
import { useSpeech } from "@/lib/useSpeech";
import { checkPromptAndPersonality } from "@/lib/handlePrompt";
import toast from "react-hot-toast";
import { buildMemoryContext } from "@/lib/MemoryContextPrompt";
import {
  checkAndIncrementAICount,
  getRemainingAICount,
} from "@/lib/aiRateLimit";
import { saveChatApi, getRecentChatsApi } from "../lib/ChatFunctions";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
interface AIResponse {
  question: string;
  answer: string;
  source?: "routine" | "general" | "personality" | "goals";
}

interface AIContextType {
  aiResponse: AIResponse | null;
  isAILoading: boolean;
  handleAskAI: (question: string) => Promise<void>;
  aiorbSpeak: boolean;
  setaiOrbSpeak: (value: boolean) => void;
  showResponse: boolean;
  typedText: string;
  setTypedText: React.Dispatch<React.SetStateAction<string>>;
  setShowResponse: React.Dispatch<React.SetStateAction<boolean>>;

  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  handleSubmitPrompt: () => void;

  chatSession: { prompt: string; response: string; timestamp: number }[];
  setChatSession: React.Dispatch<
    React.SetStateAction<
      { prompt: string; response: string; timestamp: number }[]
    >
  >;

  loadingProgress: boolean;
  setLoadingProgress: React.Dispatch<React.SetStateAction<boolean>>;

  remainingAICount: number;
  setRemainingAICount: React.Dispatch<React.SetStateAction<number>>;

  typeTextDelayed: string;
  setTypeTextDelayed: React.Dispatch<React.SetStateAction<string>>;

  handleAskRoutine: (question: string) => Promise<void>;

  handleGoalsQuestion: (question: string) => Promise<void>;
  isListening: boolean;
  toggleListening: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

export const AIProvider = ({ children }: { children: React.ReactNode }) => {
  const [remainingAICount, setRemainingAICount] = useState<number>(3);

  const { currentUser, routines, goals } = useAppContext();
  const { speak, isSpeaking } = useSpeech();

  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiorbSpeak, setaiOrbSpeak] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [typeTextDelayed, setTypeTextDelayed] = useState(""); // just for function who need extra delay before typewriter effect.
  const [showResponse, setShowResponse] = useState(false); // state to show input or ai reponse

  const [prompt, setPrompt] = useState<string>(""); //user prompts via input field
  const [loadingProgress, setLoadingProgress] = useState(false); // NEW: For visual feedback

  const [chatSession, setChatSession] = useState<
    { prompt: string; response: string; timestamp: number }[]
  >([]);

  const { transcript, listening, browserSupportsSpeechRecognition, resetTranscript, isMicrophoneAvailable } =
    useSpeechRecognition();

  const toggleListening = async () => {
    console.log("🎤 toggleListening called");
    console.log("- Browser support:", browserSupportsSpeechRecognition);
    console.log("- Microphone available:", isMicrophoneAvailable);
    console.log("- Currently listening:", listening);
    
    if (!browserSupportsSpeechRecognition) {
      toast.error("Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (!isMicrophoneAvailable) {
      toast.error("Microphone not available. Please check your device settings.");
      return;
    }

    try {
      if (listening) {
        console.log("🛑 Stopping speech recognition");
        SpeechRecognition.stopListening();
        resetTranscript(); // Clear the transcript
      } else {
        console.log("▶️ Starting speech recognition");
        await SpeechRecognition.startListening({ 
          continuous: true, 
          language: "en-US" 
        });
        console.log("✅ Speech recognition started successfully");
      }
    } catch (error: any) {
      console.error("❌ Speech recognition error:", error);
      toast.error("Failed to access microphone. Please allow microphone permissions.");
    }
  };

  useEffect(() => {
    if (transcript) {
      console.log("📝 Transcript updated:", transcript);
      setPrompt(transcript);
    }
  }, [transcript]);

  // Initialize speech recognition on mount
  useEffect(() => {
    console.log("🎙️ Speech Recognition initialized");
    console.log("- Browser support:", browserSupportsSpeechRecognition);
    console.log("- Microphone available:", isMicrophoneAvailable);
    
    // Request microphone permission on mount
    if (browserSupportsSpeechRecognition && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log("✅ Microphone permission granted");
        })
        .catch((error) => {
          console.warn("⚠️ Microphone permission denied or not available:", error);
        });
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  // Save chat to backend (background)
  const saveChatToBackend = async (
    prompt: string,
    response: string,
    currentUser: any
  ) => {
    if (!currentUser?._id) return;
    try {
      await saveChatApi(prompt, response);
      console.log("Chat saved to DB");
    } catch (error) {
      console.error("Chat save failed:", error);
    }
  };

  // Fetch recent chats for AI context
  const getRecentContext = async (currentUser: any) => {
    if (!currentUser?._id) return [];
    try {
      const chats = await getRecentChatsApi();
      return chats;
    } catch (error) {
      console.error("Recent chat fetch failed:", error);
      return [];
    }
  };
  // Add chat to UI session + trigger backend save
  const addChatToSession = (
    prompt: string,
    response: string,
    currentUser: any
  ) => {
    const newChat = { prompt, response, timestamp: Date.now() };
    setChatSession((prev) => [...prev, newChat]);
    saveChatToBackend(prompt, response, currentUser);
  };

  const handleAskAI = async (question: string) => {
    if (!currentUser || !currentUser.personality) return;
    if (isAILoading || aiorbSpeak) return;

    setIsAILoading(true);
    setShowResponse(false);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!apiKey) {
        console.error("NEXT_PUBLIC_GROQ_KEY is not defined. Please check your .env.local file and restart the dev server.");
        toast.error("API key not configured. Please restart the server.");
        return;
      }
      
      const response = await callGroqAI({
        apiKey,
        mode: "personality_q",
        question,
        name: currentUser.name,
        occupation: currentUser.occupation,
        personality: currentUser.personality,
      });

      setAIResponse({ question, answer: response });

      speak(response, {
        rate: 1,
        pitch: 1.1,
        lang: "en-US",
        voiceName: "Microsoft Hazel - English (United Kingdom)",
      });

      setTypedText("");
      setShowResponse(true);
    } catch (err: any) {
      console.error("Error in handleAskAI:", err.message);
      toast.error("AI couldn't respond. Try again.");
    } finally {
      setIsAILoading(false);
    }
  };

  // USER PROMPTS ----------------------------
  const handleSubmitPrompt = async () => {
    if (!currentUser) return;
    if (isAILoading || aiorbSpeak) return;

    const isValid = checkPromptAndPersonality({
      prompt,
      personality: currentUser.personality,
    });

    if (!isValid) {
      speak(
        `${currentUser.name}. Please complete your personality test first. As it will help me to know about you better.`,
        {
          rate: 1,
          pitch: 1.1,
          lang: "en-US",
          voiceName: "Microsoft Hazel - English (United Kingdom)",
        }
      );
      return;
    }



    setIsAILoading(true);
    setLoadingProgress(true);
    setShowResponse(true);

    const submittedPrompt = prompt;
    
    // Stop listening and clear transcript FIRST
    if (listening) {
      SpeechRecognition.stopListening();
    }
    resetTranscript(); // Clear speech recognition transcript
    
    // Then clear input
    setPrompt("");

    try {
      const recentContext = await getRecentContext(currentUser);
     
      const memory = await buildMemoryContext({
        prompt: submittedPrompt,
        userId: currentUser._id,
      });
    

      const journalSummaries = memory
        .filter((item) => item.type === "journal")
        .map((j) => j.content);

      // Removed toast notification for journal syncing
      // if (journalSummaries.length > 0) {
      //   toast.loading("Syncing");
      //   console.log("journal summaries:", journalSummaries);
      // } 

      const apiKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!apiKey) {
        console.error("NEXT_PUBLIC_GROQ_KEY is not defined. Please check your .env.local file and restart the dev server.");
        toast.error("API key not configured. Please restart the server.");
        return;
      }

      const aiReply = await callGroqAI({
        apiKey,
        mode: "general_q",
        question: submittedPrompt,
        name: currentUser.name,
        occupation: currentUser.occupation || "User",
        personality: currentUser.personality,
        goals: goals,
        journalSummaries,
        recentContext,
        routines: routines,
      });

      setAIResponse({ question: submittedPrompt, answer: aiReply });
      addChatToSession(submittedPrompt, aiReply, currentUser);
      // console.log("AI Response:", aiReply);

      speak(aiReply, {
        rate: 1,
        pitch: 1.1,
        lang: "en-US",
        voiceName: "Microsoft Hazel - English (United Kingdom)",
      });

      setTypedText(""); // reset typing
    } catch (error: any) {
      console.error("❌ handleSubmitPrompt error:", error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsAILoading(false);
      setLoadingProgress(false);
    }
  };

  // USER ROUTINE QUESTION------------------------
  const handleAskRoutine = async (question: string) => {
    if (!currentUser || !currentUser.personality) return;
    if (isAILoading || aiorbSpeak) return;

    setIsAILoading(true);
    setLoadingProgress(true);
    setShowResponse(false);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!apiKey) {
        console.error("NEXT_PUBLIC_GROQ_KEY is not defined. Please check your .env.local file and restart the dev server.");
        toast.error("API key not configured. Please restart the server.");
        return;
      }

      const responseRoutine = await callGroqAI({
        apiKey,
        mode: "routine_q",
        question,
        name: currentUser.name,
        occupation: currentUser.occupation,
        personality: currentUser.personality,
        goals: goals, // currentUser.goals || [],
        routines: routines, // Send routines here
      });

      setAIResponse({ question, answer: responseRoutine, source: "routine" });
      // console.log("AI Response :", responseRoutine);
      speak(responseRoutine, {
        rate: 1,
        pitch: 1.1,
        lang: "en-US",
        voiceName: "Microsoft Hazel - English (United Kingdom)",
      });

      // setTypedText("");
      setTypeTextDelayed("");
      setShowResponse(true);
    } catch (err) {
      toast.error("Failed to get AI response");
    } finally {
      setIsAILoading(false);
      setLoadingProgress(false);
    }
  };
  // USER GOALS QUESTION------------------------
  const handleGoalsQuestion = async (question: string) => {
    if (!currentUser || !currentUser.personality) return;
    if (isAILoading || aiorbSpeak) return;

    setIsAILoading(true);
    setLoadingProgress(true);
    setShowResponse(false);
    try {
      const responseGoals = await callGroqAI({
        apiKey: process.env.NEXT_PUBLIC_GROQ_KEY!,
        mode: "goal_suggest",
        question,
        name: currentUser.name,
        occupation: currentUser.occupation,
        personality: currentUser.personality,
        goals: goals, // currentUser.goals || [],
        routines: routines, // Send routines here
      });
      setAIResponse({ question, answer: responseGoals, source: "goals" });
      // console.log("AI Response :", responseGoals);

      speak(responseGoals, {
        rate: 1,
        pitch: 1.1,
        lang: "en-US",
        voiceName: "Microsoft Hazel - English (United Kingdom)",
      });

      setTypeTextDelayed("");
      setShowResponse(true);
    } catch (err) {
      toast.error("Failed to get AI response");
    } finally {
      setIsAILoading(false);
      setLoadingProgress(false);
    }
  };
  // Track speaking state to control Orb-------------------------

  useEffect(() => {
    setaiOrbSpeak(isSpeaking);
  }, [isSpeaking]);

  useEffect(() => {
    if (currentUser) {
      const remaining = getRemainingAICount(currentUser._id);
      setRemainingAICount(remaining);
    }
  }, [currentUser, aiResponse]); // re-run when user or AI answers change

  return (
    <AIContext.Provider
      value={{
        aiResponse,
        isAILoading,
        handleAskAI,
        aiorbSpeak,
        setaiOrbSpeak,
        showResponse,
        typedText,
        setTypedText,
        setShowResponse,
        prompt,
        setPrompt,
        handleSubmitPrompt,
        chatSession,
        setChatSession,
        loadingProgress,
        setLoadingProgress,
        remainingAICount,
        setRemainingAICount,
        handleAskRoutine,
        typeTextDelayed,
        setTypeTextDelayed,
        handleGoalsQuestion,
        isListening: listening,
        toggleListening,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAIContext = () => {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAIContext must be used inside AIProvider");
  return ctx;
};
