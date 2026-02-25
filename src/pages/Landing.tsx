import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATES } from "@/data/constants";
import { ArrowRight, Globe, Sun, Moon, Bot, BookOpen, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import tmLogo from "@/assets/tm-logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const dashTarget = user ? "/dashboard" : "/auth";

  const steps = [
    { icon: Bot, title: t("landing.step1Title"), desc: t("landing.step1Desc"), color: "bg-primary/10 text-primary" },
    { icon: BookOpen, title: t("landing.step2Title"), desc: t("landing.step2Desc"), color: "bg-brand-orange/10 text-brand-orange" },
    { icon: Rocket, title: t("landing.step3Title"), desc: t("landing.step3Desc"), color: "bg-brand-green/10 text-brand-green" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], x: [0, -20, 0], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={tmLogo} alt="ThoughtMind" className="w-10 h-10 object-contain rounded-xl shadow-md" />
            <span className="font-display font-bold text-xl gradient-text text-inherit">ThoughtMind</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-xs font-medium" onClick={() => setLocale(locale === "th" ? "en" : "th")}>
              <Globe className="h-4 w-4" />
              {locale === "th" ? "TH" : "EN"}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={() => navigate(dashTarget)} variant="outline" className="rounded-xl">
              {user ? t("landing.enterDashboard") : t("landing.signIn")}
            </Button>
          </div>
        </nav>

        {/* Hero content */}
        <section className="relative z-10 max-w-3xl mx-auto text-center px-6 pt-24 pb-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">{t("landing.footer")}</div>
      </footer>
    </div>
  );
}
