import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Shield,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  FileText,
  Bell,
  Megaphone,
  ClipboardList,
  Target,
} from "lucide-react";

const features = [
  { icon: Users, title: "Lead & Contact Management", desc: "Capture, score and nurture leads with a unified contact view." },
  { icon: Briefcase, title: "Deal Pipeline", desc: "Drag-and-drop deal stages with revenue forecasting." },
  { icon: ClipboardList, title: "Task Assignment", desc: "Assign tasks to teams, track status and daily progress." },
  { icon: Calendar, title: "Attendance & Holidays", desc: "Daily check-in, leave management and holiday calendar." },
  { icon: FileText, title: "Daily & Weekly Reports", desc: "Structured reporting with manager review workflow." },
  { icon: MessageSquare, title: "Helpdesk", desc: "Internal ticketing for support and operations." },
  { icon: Megaphone, title: "Marketing & Quotations", desc: "Track campaigns ROI and generate professional quotes." },
  { icon: Shield, title: "DigiLocker Verification", desc: "Secure employee KYC with document verification." },
  { icon: Bell, title: "Broadcast Notifications", desc: "Send targeted or company-wide alerts in one click." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time KPIs across sales, HR and operations." },
  { icon: Building2, title: "Employee Directory", desc: "Centralised profiles with role-based access control." },
  { icon: Target, title: "System Customization", desc: "Tailor every module, template and workflow to your team." },
];

const plans = [
  {
    name: "Starter",
    price: "₹1,499",
    period: "/user/month",
    desc: "Perfect for small teams getting started.",
    features: ["Up to 10 users", "Lead & Contact CRM", "Basic Reports", "Email Support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹2,999",
    period: "/user/month",
    desc: "Most popular for growing companies.",
    features: ["Up to 50 users", "Full CRM + HR Suite", "Attendance & Tasks", "Helpdesk + Quotations", "Priority Support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large organizations with custom needs.",
    features: ["Unlimited users", "All Modules + DigiLocker", "Custom Integrations", "Dedicated Manager", "SLA & On-prem options"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur bg-background/80 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">BanegaBrand CRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#contact" className="hover:text-foreground transition">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link to="/auth"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">Built for BanegaBrand Pvt Ltd</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The complete <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Sales & HR CRM</span> for modern teams
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Manage leads, deals, employees, attendance, tasks, helpdesk and reporting — all in one secure, role-based platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth"><Button size="lg" className="gap-2">Start Free Trial <ArrowRight className="w-4 h-4" /></Button></Link>
              <a href="#pricing"><Button size="lg" variant="outline">View Pricing</Button></a>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 14-day free trial</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything your business needs</h2>
          <p className="text-muted-foreground">From lead capture to employee verification — one platform, every workflow.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="hover:shadow-lg transition border-border/60">
              <CardHeader>
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Choose the plan that fits your team. Upgrade anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <Card key={p.name} className={`relative ${p.highlight ? "border-primary shadow-xl scale-105" : ""}`}>
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-muted-foreground">{p.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button className="w-full" variant={p.highlight ? "default" : "outline"}>{p.cta}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary to-accent border-0 text-primary-foreground">
          <CardContent className="p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your business?</h2>
            <p className="opacity-90 mb-6 max-w-xl mx-auto">Join BanegaBrand teams already managing sales, HR and operations on one platform.</p>
            <Link to="/auth"><Button size="lg" variant="secondary" className="gap-2">Get Started Free <ArrowRight className="w-4 h-4" /></Button></Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} BanegaBrand Pvt Ltd. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link to="/auth" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
