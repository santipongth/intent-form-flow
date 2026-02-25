import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATES } from "@/data/mockData";
import { ArrowRight, Sparkles, Zap, Shield, Globe, Sun, Moon } from "lucide-react";
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

  const features = [
  { icon: Sparkles, title: t("landing.feature1Title"), description: t("landing.feature1Desc"), color: "text-primary" },
  { icon: Zap, title: t("landing.feature2Title"), description: t("landing.feature2Desc"), color: "text-brand-orange" },
  { icon: Shield, title: t("landing.feature3Title"), description: t("landing.feature3Desc"), color: "text-brand-green" }];


  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

          <motion.div
            className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], x: [0, -20, 0], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />

        </div>

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 blur-lg scale-110" />
              <img src={tmLogo} alt="ThoughtMind" className="relative w-16 h-16 object-contain rounded-2xl ring-2 ring-primary/10 shadow-lg" />
            </div>
            <span className="font-display font-bold text-xl gradient-text text-inherit">ThoughtMind</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-xs font-medium"
              onClick={() => setLocale(locale === "th" ? "en" : "th")}>

              <Globe className="h-4 w-4" />
              {locale === "th" ? "TH" : "EN"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={toggleTheme}>

              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={() => navigate(dashTarget)} variant="outline" className="rounded-xl">
              {user ? t("landing.enterDashboard") : t("landing.signIn")}
            </Button>
          </div>
        </nav>

        <section className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            



            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {t("landing.heroTitle1")} <span className="gradient-text">{t("landing.heroTitle2")}</span><br />
              {t("landing.heroTitle3")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("landing.heroDesc")}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="gradient-primary text-primary-foreground rounded-xl text-base px-8 gap-2" onClick={() => navigate("/agents/new")}>
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

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) =>
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <f.icon className={`h-10 w-10 mb-4 ${f.color}`} />
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Template Gallery */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold mb-3">{t("landing.templateTitle")}</h2>
          <p className="text-muted-foreground">{t("landing.templateDesc")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATES.map((tmpl, i) =>
          <motion.div key={tmpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group" onClick={() => navigate("/agents/new")}>
                <CardContent className="p-5">
                  <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${tmpl.color} mb-4`} />
                  <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">{tmpl.name}</h3>
                  <p className="text-sm text-muted-foreground">{tmpl.description}</p>
                  <span className="inline-block mt-3 text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1">{tmpl.category}</span>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          {t("landing.footer")}
        </div>
      </footer>
    </div>);

}