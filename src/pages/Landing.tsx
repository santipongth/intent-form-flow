import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/data/constants";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Database,
  Globe,
  Moon,
  Play,
  Rocket,
  Sparkles,
  Sun,
  WandSparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import tmLogo from "@/assets/tm-logo-lockup.png";
import tmLogoMark from "@/assets/tm-logo-mark.png";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const dashTarget = user ? "/dashboard" : "/auth";

  const steps = [
    { icon: Bot, title: t("landing.step1Title"), desc: t("landing.step1Desc"), color: "text-primary", surface: "bg-primary/10" },
    { icon: BookOpen, title: t("landing.step2Title"), desc: t("landing.step2Desc"), color: "text-brand-orange", surface: "bg-brand-orange/10" },
    { icon: Rocket, title: t("landing.step3Title"), desc: t("landing.step3Desc"), color: "text-brand-green", surface: "bg-brand-green/10" },
  ];

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.5, delay },
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background selection:bg-primary/15">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl" aria-label={t("landing.mainNav")}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Button
            variant="ghost"
            className="group h-auto gap-3 p-0 hover:bg-transparent"
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
            aria-label="ThoughtMind"
          >
            <span className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow group-hover:shadow-md sm:h-14 sm:w-20">
              <img src={tmLogoMark} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="hidden font-display text-xl font-bold text-foreground sm:block">ThoughtMind</span>
          </Button>

          <div className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">{t("landing.navHow")}</a>
            <a href="#templates" className="transition-colors hover:text-foreground">{t("landing.navTemplates")}</a>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold" onClick={() => setLocale(locale === "th" ? "en" : "th")} aria-label={t("landing.switchLanguage")}>
              <Globe className="h-4 w-4" />
              {locale === "th" ? "TH" : "EN"}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={toggleTheme} aria-label={t("landing.toggleTheme")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={() => navigate(dashTarget)} variant="outline" className="hidden rounded-lg sm:inline-flex">
              {user ? t("landing.enterDashboard") : t("landing.signIn")}
            </Button>
            <Button onClick={() => navigate(user ? "/agents/new" : "/auth")} className="hidden rounded-lg lg:inline-flex">
              {t("landing.navTry")}
            </Button>
          </div>
        </div>
      </nav>

      <header className="relative border-b border-border/50">
        <section className="mx-auto flex max-w-7xl flex-col justify-center px-4 pb-14 pt-14 sm:px-6 md:pb-16 md:pt-16">
          <motion.div className="mx-auto max-w-4xl text-center" initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.55 }}>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing.tagline")}
            </div>
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.08] sm:text-6xl md:text-7xl">
              {t("landing.heroTitle1")} <span className="gradient-text">{t("landing.heroTitle2")}</span>
              <br />
              {t("landing.heroTitle3")}
            </h1>
            <p className="mx-auto mb-9 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.heroDesc")}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gradient-primary h-12 gap-2 rounded-lg px-7 text-base text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5" onClick={() => navigate("/agents/new")}>
                {t("landing.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 gap-2 rounded-lg px-7 text-base" onClick={() => document.getElementById("templates")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })}>
                <Play className="h-4 w-4" />
                {t("landing.exploreTemplates")}
              </Button>
            </div>
          </motion.div>

          <motion.div className="relative mx-auto mt-14 w-full max-w-5xl" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.15 }}>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex h-11 items-center justify-between border-b border-border bg-muted/40 px-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-orange/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-green/70" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">ThoughtMind / {t("landing.previewTitle")}</span>
                <span className="w-12" />
              </div>
              <div className="grid min-h-[300px] md:grid-cols-[190px_1fr]">
                <aside className="hidden border-r border-border bg-muted/20 p-4 md:block" aria-hidden="true">
                  <div className="mb-6 flex items-center gap-2 px-2 text-sm font-bold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></span>
                    ThoughtMind
                  </div>
                  {["01", "02", "03", "04", "05"].map((item, index) => (
                    <div key={item} className={`mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold ${index === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                      <span>{item}</span><span className="h-1.5 flex-1 rounded-full bg-current opacity-20" />
                    </div>
                  ))}
                </aside>
                <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.1fr_.9fr]">
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase text-primary">{t("landing.previewStep")}</p>
                        <h2 className="font-display text-xl font-bold">{t("landing.previewHeading")}</h2>
                      </div>
                      <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">{t("landing.previewReady")}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><WandSparkles className="h-4 w-4 text-primary" />{t("landing.previewGoal")}</div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{t("landing.previewGoalText")}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border p-4"><Database className="mb-3 h-5 w-5 text-brand-blue" /><p className="text-sm font-bold">{t("landing.previewKnowledge")}</p><p className="mt-1 text-xs text-muted-foreground">3 {t("landing.previewSources")}</p></div>
                        <div className="rounded-lg border border-border p-4"><Sparkles className="mb-3 h-5 w-5 text-accent" /><p className="text-sm font-bold">Skills</p><p className="mt-1 text-xs text-muted-foreground">4 {t("landing.previewSelected")}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between rounded-lg bg-foreground p-5 text-background">
                    <div>
                      <div className="mb-6 flex items-center justify-between">
                        <span className="text-sm font-bold">{t("landing.previewSummary")}</span>
                        <span className="flex items-center gap-1.5 text-xs opacity-70"><span className="h-2 w-2 rounded-full bg-brand-green" />{t("landing.previewLive")}</span>
                      </div>
                      {[t("landing.previewCheck1"), t("landing.previewCheck2"), t("landing.previewCheck3")].map((item) => (
                        <div key={item} className="mb-3 flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-brand-green" />{item}</div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-background/20 pt-4 text-xs">
                      <span className="opacity-60">openai/gpt-5</span>
                      <span className="font-bold">{t("landing.previewLaunch")} →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </header>

      <main>
        <section id="how-it-works" className="scroll-mt-20 border-b border-border bg-muted/20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div className="mb-14 max-w-2xl" {...reveal()}>
              <p className="mb-3 text-xs font-bold uppercase text-primary">{t("landing.howEyebrow")}</p>
              <h2 className="mb-4 font-display text-3xl font-bold sm:text-4xl">{t("landing.howItWorksTitle")}</h2>
              <p className="text-muted-foreground">{t("landing.howItWorksDesc")}</p>
            </motion.div>

            <div className="relative grid gap-10 md:grid-cols-3">
              <div className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" />
              {steps.map((step, index) => (
                <motion.article key={step.title} className="relative" {...reveal(index * 0.08)}>
                  <div className={`relative z-10 mb-7 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-background ${step.color} shadow-sm`}>
                    <step.icon className="h-6 w-6" />
                    <span className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step.surface}`}>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-bold">{step.title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end" {...reveal()}>
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase text-primary">{t("landing.templatesEyebrow")}</p>
                <h2 className="mb-4 font-display text-3xl font-bold sm:text-4xl">{t("landing.templateTitle")}</h2>
                <p className="text-muted-foreground">{t("landing.templateDesc")}</p>
              </div>
              <Button variant="outline" className="w-fit rounded-lg" onClick={() => navigate(user ? "/marketplace" : "/auth")}>
                {t("landing.viewAllTemplates")}<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template, index) => (
                <motion.button
                  key={template.id}
                  type="button"
                  className="group min-h-48 rounded-lg border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => navigate("/agents/new")}
                  {...reveal(index * 0.05)}
                >
                  <div className={`mb-5 h-1 w-12 rounded-full bg-gradient-to-r ${template.color}`} />
                  <span className="mb-3 inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">{template.category}</span>
                  <h3 className="mb-2 font-display text-base font-bold transition-colors group-hover:text-primary">{template.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>
                  <span className="mt-5 flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{t("landing.useTemplate")}<ArrowRight className="h-3.5 w-3.5" /></span>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-bold text-foreground"><img src={tmLogo} alt="" className="h-8 w-12 object-contain" />ThoughtMind</div>
          <span>{t("landing.footer")}</span>
        </div>
      </footer>
    </div>
  );
}