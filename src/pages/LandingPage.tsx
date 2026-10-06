import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  CloudUpload,
  MessageCircleQuestion,
  Lightbulb,
  Layers,
  Gauge,
  BookOpen,
  Send,
  FileText
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const LandingPage: React.FC = () => {
  const [sampleInput, setSampleInput] = useState('');
  const navigate = useNavigate();

  const handleSampleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sampleInput.trim()) {
      navigate(`/tutor?q=${encodeURIComponent(sampleInput.trim())}`);
    } else {
      navigate('/tutor');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)] pointer-events-none" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.05fr_1fr]">
          {/* Hero Left */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Your Personal AI Tutor. Learn Anything, Simply.
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              Your Study Material.
              <br />
              <span className="text-primary bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                Your Personal AI Tutor.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Upload your notes, ask anything, and understand difficult concepts through simple explanations and real-world examples.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tutor"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:opacity-95 hover:-translate-y-px h-11 rounded-lg px-6 text-[15px]"
              >
                Start Learning <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-11 rounded-lg px-6 text-[15px]"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero Right: Live Interactive Preview Card */}
          <div>
            <div className="relative rounded-2xl border bg-card p-2 shadow-xl">
              <div className="flex items-center gap-1.5 border-b px-3 pb-2 pt-1">
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="ml-3 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  <FileText className="size-3 text-primary" /> Biology Ch.4 — Photosynthesis.pdf
                </span>
              </div>

              <div className="space-y-4 p-4">
                {/* User Bubble */}
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                  Explain photosynthesis like I'm 10 🌱
                </div>

                {/* Tutor Answer */}
                <div className="space-y-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Simple explanation
                  </p>
                  <p className="leading-relaxed text-foreground">
                    Plants are tiny solar-powered kitchens. They take <b>sunlight</b>, <b>water</b> and <b>air</b>, and cook up sugar for energy.
                  </p>

                  <div className="rounded-xl border bg-muted/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Real-world example
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                      Like a lemonade stand that runs on sunshine — oxygen is the leftover it hands back to us.
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-foreground">
                    <b>Remember:</b> Light + water + air → sugar + oxygen.
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono">
                    Source · Biology Ch.4, p.3
                  </p>
                </div>
              </div>

              {/* Sample Question Input */}
              <form onSubmit={handleSampleSubmit} className="m-2 flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground focus-within:border-primary/50 transition-colors">
                <input
                  type="text"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder="Ask a question about this..."
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="size-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <p className="text-sm font-medium text-primary">How it works</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Three steps from confused to confident.</h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <CloudUpload className="size-5" />
              </span>
              <span className="font-mono text-sm text-muted-foreground">01</span>
            </div>
            <h3 className="mt-5 font-semibold text-foreground">Upload your study material</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Drop in PDFs, Word docs or plain-text notes. StudyBuddy indexes every page for instant retrieval.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageCircleQuestion className="size-5" />
              </span>
              <span className="font-mono text-sm text-muted-foreground">02</span>
            </div>
            <h3 className="mt-5 font-semibold text-foreground">Ask questions about your documents</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ask anything — from “summarize chapter 4” to “why does this formula work?”
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="size-5" />
              </span>
              <span className="font-mono text-sm text-muted-foreground">03</span>
            </div>
            <h3 className="mt-5 font-semibold text-foreground">Understand with simple explanations</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Get plain-language answers with analogies, step-by-step breakdowns and quick check-ups.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20 border-y bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-3">
          <div>
            <Layers className="size-5 text-primary" />
            <h3 className="mt-4 font-semibold text-foreground">Answers grounded in your notes</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Responses cite the document and page they came from with FAISS vector search, so you can always check the source.
            </p>
          </div>

          <div>
            <Gauge className="size-5 text-primary" />
            <h3 className="mt-4 font-semibold text-foreground">Pick your level</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              From “Explain Like I'm 5” to Advanced — the tutor adapts its language and depth to where you are.
            </p>
          </div>

          <div>
            <BookOpen className="size-5 text-primary" />
            <h3 className="mt-4 font-semibold text-foreground">Study sessions that stick</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Every conversation is saved so you can pick up exactly where you left off, review quizzes, and reinforce concepts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Ready to actually understand it?</h2>
        <p className="mt-3 text-muted-foreground">Try the tutor with our demo documents or your own notes.</p>
        <Link
          to="/tutor"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:opacity-95 hover:-translate-y-px h-11 rounded-lg px-6 text-[15px] mt-7"
        >
          Start Learning <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4.5" />
            </span>
            <span>StudyBuddy AI</span>
          </Link>
          <nav className="flex gap-6">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/tutor" className="hover:text-foreground transition-colors">AI Tutor</Link>
            <Link to="/documents" className="hover:text-foreground transition-colors">Documents</Link>
            <Link to="/sessions" className="hover:text-foreground transition-colors">Sessions</Link>
          </nav>
          <p>© 2026 StudyBuddy AI · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};
