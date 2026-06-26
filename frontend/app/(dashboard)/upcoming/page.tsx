"use client";

import { motion, Variants } from "framer-motion";
import {
  TrendingUp,
  Package,
  BarChart3,
  Bot,
  CalendarDays,
  Coins,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

const upcomingFeatures = [
  {
    title: "Demand Forecasting using AI",
    description: "Predict next week's inventory requirements using historical order patterns and localized event signals.",
    icon: TrendingUp,
    gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
    iconColor: "text-blue-500",
    borderColor: "group-hover:border-blue-550 dark:group-hover:border-blue-800",
  },
  {
    title: "Inventory Optimization",
    description: "Determine safety margins and receive auto-replenishment triggers based on real-time ingredient consumption rates.",
    icon: Package,
    gradient: "from-orange-500/10 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/20",
    iconColor: "text-orange-500",
    borderColor: "group-hover:border-orange-550 dark:group-hover:border-orange-800",
  },
  {
    title: "Daily Sales Analytics",
    description: "Deep analytics on ingredient profit margins, raw materials waste metrics, and peak service hours correlation.",
    icon: BarChart3,
    gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
    iconColor: "text-emerald-500",
    borderColor: "group-hover:border-emerald-550 dark:group-hover:border-emerald-800",
  },
  {
    title: "AI Procurement Assistant",
    description: "An intelligent chatbot to interact with your supply records, compile purchase orders, and negotiate supplier deals.",
    icon: Bot,
    gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20",
    iconColor: "text-purple-500",
    borderColor: "group-hover:border-purple-550 dark:group-hover:border-purple-800",
  },
  {
    title: "Seasonal Demand Prediction",
    description: "Advanced machine learning modeling adjusting purchase guides in response to weather shifts and public holidays.",
    icon: CalendarDays,
    gradient: "from-cyan-500/10 to-sky-500/10 dark:from-cyan-500/20 dark:to-sky-500/20",
    iconColor: "text-cyan-500",
    borderColor: "group-hover:border-cyan-550 dark:group-hover:border-cyan-800",
  },
  {
    title: "Smart Price Trends",
    description: "Track market prices for vegetables, grains, and meats across Pune mandis, predicting the best buying windows.",
    icon: Coins,
    gradient: "from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20",
    iconColor: "text-rose-500",
    borderColor: "group-hover:border-rose-550 dark:group-hover:border-rose-800",
  },
];

export default function UpcomingFeaturesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-popover p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl z-10">
          <Badge className="bg-primary/10 text-primary border-0 font-semibold px-3 py-1 text-xs rounded-full">
            <Sparkles className="h-3 w-3 mr-1 fill-primary" /> Intelligence Roadmap
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-gradient-orange leading-tight">
            Upcoming Features
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our data science team is actively building and training predictive models to make your supply chain even smarter. Preview our pipeline below.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 to-transparent pointer-events-none" />
      </div>

      {/* Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {upcomingFeatures.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div key={idx} variants={cardVariants} className="group">
              <Card className={`h-full border border-slate-150 dark:border-slate-800 bg-popover rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${feature.borderColor}`}>
                <CardHeader className="pb-2">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-350`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold font-heading text-slate-800 dark:text-slate-200">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full tracking-wider">
                      Module Training
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-semibold">Q3 2026</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
