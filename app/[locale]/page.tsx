"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Mic, Star, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background -z-10" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                AI-Powered Music Creation
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Turn Your Story <br className="hidden sm:inline" />
                Into a Hit Song
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                Share your story, get professional lyrics and AI-generated music in minutes. Your personal hit song awaits.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 w-full justify-center"
            >
              <Link href="/create">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg gap-2">
                  Create Your Song <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg">
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> No music skills needed</div>
              <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Ready in 2 minutes</div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three steps to your personal hit song.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background p-8 rounded-xl border hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary mx-auto">
                  {step.icon}
                </div>
                <div className="text-sm font-semibold text-primary mb-2">Step {index + 1}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create your hit song?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of people who have already turned their stories into music.
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const steps = [
  {
    title: "Share Your Story",
    description: "Tell us about a moment, feeling, or experience you want to turn into a song.",
    icon: <Mic className="w-6 h-6" />,
  },
  {
    title: "Get Your Lyrics",
    description: "AI analyzes your story and crafts professional lyrics with the perfect emotional style.",
    icon: <Music className="w-6 h-6" />,
  },
  {
    title: "Receive Your Song",
    description: "Two unique AI-generated tracks are created. Pick your favorite and share it with the world.",
    icon: <Star className="w-6 h-6" />,
  },
];
