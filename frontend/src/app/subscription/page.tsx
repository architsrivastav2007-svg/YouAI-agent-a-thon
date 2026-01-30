"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface PricingTier {
  name: string;
  price: number;
  aiCalls: number;
  icon: React.ReactNode;
  features: string[];
  color: string;
  popular?: boolean;
  tier: "free" | "pro" | "premium";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: 0,
    aiCalls: 10,
    tier: "free",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-gray-400 to-gray-600",
    features: [
      "10 AI calls per day",
      "Basic personality insights",
      "Journal tracking",
      "Goal management",
      "Routine suggestions",
    ],
  },
  {
    name: "Pro",
    price: 9.99,
    aiCalls: 100,
    tier: "pro",
    icon: <Zap className="w-6 h-6" />,
    color: "from-indigo-400 to-indigo-600",
    popular: true,
    features: [
      "100 AI calls per day",
      "Advanced personality analysis",
      "Priority AI responses",
      "Detailed journal insights",
      "Custom routine planning",
      "Progress analytics",
    ],
  },
  {
    name: "Premium",
    price: 19.99,
    aiCalls: -1, // Unlimited
    tier: "premium",
    icon: <Crown className="w-6 h-6" />,
    color: "from-yellow-400 to-yellow-600",
    features: [
      "Unlimited AI calls",
      "Premium personality reports",
      "Real-time AI insights",
      "Advanced analytics dashboard",
      "Custom AI training",
      "Priority support",
      "Early access to features",
    ],
  },
];

export default function SubscriptionPage() {
  const { currentUser, loading, refetchUser } = useAppContext();
  const router = useRouter();
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const currentTier = currentUser?.subscription?.tier || "free";

  const handleSubscribe = async (tier: PricingTier) => {
    if (!currentUser) {
      toast.error("Please log in to subscribe");
      router.push("/login");
      return;
    }

    if (tier.tier === currentTier) {
      toast("You're already on this plan!", { icon: "ℹ️" });
      return;
    }

    if (tier.tier === "free") {
      toast.error("You're already on the free plan");
      return;
    }

    setProcessingTier(tier.tier);

    try {
      // TODO: In production, integrate with Stripe/payment gateway
      // For now, we'll simulate the subscription upgrade
      const response = await api.post("/api/subscription/upgrade", {
        tier: tier.tier,
      });

      if (response.data.success) {
        toast.success(`Successfully upgraded to ${tier.name}! 🎉`);
        refetchUser();
        
        // In production, redirect to payment gateway
        // window.location.href = response.data.checkoutUrl;
      } else {
        toast.error("Failed to process subscription");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.response?.data?.message || "Subscription failed");
    } finally {
      setProcessingTier(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#7B68DA] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#7B68DA] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-orbitron">
            <span className="bg-gradient-to-b from-white via-gray-400 to-indigo-600 text-transparent bg-clip-text [-webkit-background-clip:text]">
              Neura
            </span>
            Twin Plans
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-sora max-w-2xl mx-auto">
            Unlock your full potential with more AI-powered insights
          </p>
          {currentUser && (
            <div className="mt-4">
              <Badge className="bg-indigo-500 text-white px-4 py-2 text-sm">
                Current Plan: {currentTier.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative bg-gray-800/50 border-2 backdrop-blur-xl ${
                tier.popular
                  ? "border-indigo-500 shadow-xl shadow-indigo-500/20"
                  : "border-gray-700"
              } ${
                currentTier === tier.tier ? "ring-2 ring-green-500" : ""
              } transition-all hover:scale-105 duration-300`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white`}
                >
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-white font-sora">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {tier.aiCalls === -1
                    ? "Unlimited AI calls"
                    : `${tier.aiCalls} AI calls per day`}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    ${tier.price}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSubscribe(tier)}
                  disabled={
                    processingTier === tier.tier || currentTier === tier.tier
                  }
                  className={`w-full mt-6 font-semibold ${
                    currentTier === tier.tier
                      ? "bg-green-600 hover:bg-green-700"
                      : `bg-gradient-to-r ${tier.color} hover:opacity-90`
                  } text-white transition-all duration-200`}
                >
                  {processingTier === tier.tier
                    ? "Processing..."
                    : currentTier === tier.tier
                    ? "Current Plan"
                    : tier.tier === "free"
                    ? "Get Started"
                    : "Upgrade Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-gray-400 text-sm max-w-2xl mx-auto">
          <p className="mb-2">
            💳 Secure payment powered by Stripe (Coming Soon)
          </p>
          <p>
            Cancel anytime. Your AI call limit resets daily at midnight.
          </p>
        </div>
      </div>
    </div>
  );
}
