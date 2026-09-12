import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATES } from "@/data/constants";
import {
  ArrowRight,
  Globe,
  Sun,
  Moon,
  Bot,
  BookOpen,
  Rocket,
  Check,
  Sparkles,
  Database,
  WandSparkles,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import tmLogo from "@/assets/tm-logo-lockup.png";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const dashTarget = user ? "/dashboard" : "/auth";

  const steps = [
    { icon: Bot, title: t("landing.step1Title"), desc: t("landing.step1Desc"), color: "text-primary" },
    { icon: BookOpen, title: t("landing.step2Title"), desc: t("landing.step2Desc"), color: "text-brand-orange" },
    { icon: Rocket, title: t("landing.step3Title"), desc: t("landing.step3Desc"), color: "text-brand-green" },
  ];

  const scrollToTemplates = () => {
    document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background selection:bg-primary/15">
      <header className="relative border-b border-border/50 bg-background">
        <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl" aria-label={t("landing.mainNav")}>
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            <button className="group flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="ThoughtMind">
              <span className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow group-hover:shadow-md sm:h-14 sm:w-20">
                <img src={tmLogo} alt="" className="h-full w-full scale-[1.42] object-contain" />
              </span>
              <span className="hidden font-display text-xl font-bold sm:block">ThoughtMind</span>
            </button>

            <div className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
              <a href="#how-it-works" className="transition-colors hover:text-foreground">{t("landing.navHow")}</a>
              <a href="#templates" className="transition-colors hover:text-foreground">{t("landing.navTemplates")}</a>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-xs font-medium" onClick={() => setLocale(locale === "th" ? "en" : "th")}>
              <Globe className="h-4 w-4" />
              {locale === "th" ? "TH" : "EN"}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleTheme} aria-label="Toggle theme">
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

        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-4 pb-14 pt-16 sm:px-6 md:pt-20">
          <motion.div className="mx-auto max-w-4xl text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing.tagline")}
            </div>
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.08] sm:text-6xl md:text-7xl">
              {t("landing.heroTitle1")}{" "}
              <span className="gradient-text">{t("landing.heroTitle2")}</span>
              <br />
              {t("landing.heroTitle3")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              {t("landing.heroDesc")}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="gradient-primary text-primary-foreground rounded-xl text-base px-8 gap-2 shadow-lg hover:shadow-xl transition-shadow" onClick={() => navigate("/agents/new")}>
                {t("landing.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl text-base px-8" onClick={() => navigate(dashTarget)}>
                {user ? "Dashboard" : t("landing.signIn")}
              </Button>
            </div>
          </motion.div>
        </section>
      </header>

      <main>
      {/* How it Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 tracking-tight">{t("landing.howItWorksTitle")}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("landing.howItWorksDesc")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-primary/20 via-brand-orange/20 to-brand-green/20" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
            >
              {/* Step number badge */}
              <div className="relative mb-5">
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-sm`}>
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Template Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 tracking-tight">{t("landing.templateTitle")}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("landing.templateDesc")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATES.map((tmpl, i) => (
            <motion.div key={tmpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group h-full" onClick={() => navigate("/agents/new")}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${tmpl.color} mb-4`} />
                  <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">{tmpl.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1">{tmpl.description}</p>
                  <span className="inline-block mt-3 text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1 w-fit">{tmpl.category}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">{t("landing.footer")}</div>
      </footer>
    </div>
  );
}
