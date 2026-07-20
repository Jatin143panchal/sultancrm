export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "lost";
  value: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  lastContact: string;
  tags: string[];
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: "prospecting" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
  contactName: string;
  expectedClose: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "task" | "note";
  title: string;
  description: string;
  contactName: string;
  date: string;
  completed: boolean;
}

export const leads: Lead[] = [
  { id: "L001", name: "Rajesh Kumar", email: "rajesh@techcorp.in", phone: "+91 98765 43210", company: "TechCorp India", source: "Website", status: "new", value: 250000, createdAt: "2026-04-01" },
  { id: "L002", name: "Priya Sharma", email: "priya@globalsoft.com", phone: "+91 87654 32109", company: "GlobalSoft", source: "Referral", status: "contacted", value: 480000, createdAt: "2026-03-28" },
  { id: "L003", name: "Amit Patel", email: "amit@innovate.io", phone: "+91 76543 21098", company: "Innovate Solutions", source: "LinkedIn", status: "qualified", value: 750000, createdAt: "2026-03-25" },
  { id: "L004", name: "Sneha Reddy", email: "sneha@dataworks.in", phone: "+91 65432 10987", company: "DataWorks", source: "Cold Call", status: "new", value: 320000, createdAt: "2026-04-02" },
  { id: "L005", name: "Vikram Singh", email: "vikram@nexgen.com", phone: "+91 54321 09876", company: "NexGen Tech", source: "Trade Show", status: "contacted", value: 600000, createdAt: "2026-03-20" },
  { id: "L006", name: "Meera Joshi", email: "meera@cloudhub.in", phone: "+91 43210 98765", company: "CloudHub", source: "Website", status: "lost", value: 180000, createdAt: "2026-03-15" },
];

export const contacts: Contact[] = [
  { id: "C001", name: "Arjun Mehta", email: "arjun@abcgroup.in", phone: "+91 98765 11111", company: "ABC Group", position: "CEO", lastContact: "2026-04-02", tags: ["VIP", "Decision Maker"] },
  { id: "C002", name: "Kavita Nair", email: "kavita@sunriseltd.com", phone: "+91 98765 22222", company: "Sunrise Ltd", position: "CTO", lastContact: "2026-03-30", tags: ["Technical"] },
  { id: "C003", name: "Rohit Gupta", email: "rohit@megacorp.in", phone: "+91 98765 33333", company: "MegaCorp", position: "VP Sales", lastContact: "2026-03-28", tags: ["Partner"] },
  { id: "C004", name: "Anita Desai", email: "anita@startech.com", phone: "+91 98765 44444", company: "StarTech", position: "Director", lastContact: "2026-04-01", tags: ["Decision Maker"] },
  { id: "C005", name: "Suresh Iyer", email: "suresh@blueocean.in", phone: "+91 98765 55555", company: "Blue Ocean", position: "Manager", lastContact: "2026-03-25", tags: ["Prospect"] },
];

export const deals: Deal[] = [
  { id: "D001", title: "Enterprise License", company: "ABC Group", value: 1200000, stage: "negotiation", probability: 75, contactName: "Arjun Mehta", expectedClose: "2026-04-15", createdAt: "2026-03-01" },
  { id: "D002", title: "Cloud Migration", company: "Sunrise Ltd", value: 850000, stage: "proposal", probability: 50, contactName: "Kavita Nair", expectedClose: "2026-04-30", createdAt: "2026-03-10" },
  { id: "D003", title: "Annual Support", company: "MegaCorp", value: 450000, stage: "closed_won", probability: 100, contactName: "Rohit Gupta", expectedClose: "2026-03-31", createdAt: "2026-02-15" },
  { id: "D004", title: "Custom Integration", company: "StarTech", value: 2100000, stage: "prospecting", probability: 20, contactName: "Anita Desai", expectedClose: "2026-05-31", createdAt: "2026-03-20" },
  { id: "D005", title: "SaaS Platform", company: "Blue Ocean", value: 680000, stage: "proposal", probability: 40, contactName: "Suresh Iyer", expectedClose: "2026-05-15", createdAt: "2026-03-18" },
  { id: "D006", title: "Data Analytics Suite", company: "TechCorp India", value: 960000, stage: "negotiation", probability: 65, contactName: "Rajesh Kumar", expectedClose: "2026-04-20", createdAt: "2026-03-05" },
  { id: "D007", title: "Security Audit", company: "GlobalSoft", value: 350000, stage: "closed_lost", probability: 0, contactName: "Priya Sharma", expectedClose: "2026-03-25", createdAt: "2026-02-20" },
];

export const activities: Activity[] = [
  { id: "A001", type: "call", title: "Follow-up call with Arjun", description: "Discuss pricing for enterprise license", contactName: "Arjun Mehta", date: "2026-04-03", completed: false },
  { id: "A002", type: "email", title: "Send proposal to Kavita", description: "Cloud migration proposal with timeline", contactName: "Kavita Nair", date: "2026-04-03", completed: true },
  { id: "A003", type: "meeting", title: "Product demo for StarTech", description: "Demo custom integration capabilities", contactName: "Anita Desai", date: "2026-04-04", completed: false },
  { id: "A004", type: "task", title: "Prepare quarterly report", description: "Q1 sales performance summary", contactName: "", date: "2026-04-05", completed: false },
  { id: "A005", type: "note", title: "Negotiation notes - MegaCorp", description: "They want 10% discount on annual support", contactName: "Rohit Gupta", date: "2026-04-02", completed: true },
  { id: "A006", type: "call", title: "Cold call to new lead", description: "Reach out to NexGen Tech", contactName: "Vikram Singh", date: "2026-04-03", completed: false },
  { id: "A007", type: "meeting", title: "Weekly team sync", description: "Review pipeline and targets", contactName: "", date: "2026-04-03", completed: false },
];

export const revenueData = [
  { month: "Oct", revenue: 1800000, target: 2000000 },
  { month: "Nov", revenue: 2200000, target: 2000000 },
  { month: "Dec", revenue: 1950000, target: 2200000 },
  { month: "Jan", revenue: 2800000, target: 2500000 },
  { month: "Feb", revenue: 2400000, target: 2500000 },
  { month: "Mar", revenue: 3100000, target: 2800000 },
];

export const pipelineData = [
  { name: "Prospecting", value: 2100000, count: 1 },
  { name: "Proposal", value: 1530000, count: 2 },
  { name: "Negotiation", value: 2160000, count: 2 },
  { name: "Won", value: 450000, count: 1 },
  { name: "Lost", value: 350000, count: 1 },
];
