import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hinglish" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation / Sidebar
  "nav.leads": { en: "Leads", hinglish: "Leads (लीड्स)", hi: "लीड्स सूची" },
  "nav.deals": { en: "Deals", hinglish: "Deals & Orders", hi: "सौदे एवं ऑर्डर्स" },
  "nav.attendance": { en: "Attendance", hinglish: "Attendance (हाजिरी)", hi: "उपस्थिति / हाजिरी" },
  "nav.tasks": { en: "My Tasks", hinglish: "Mere Tasks", hi: "मेरे कार्य" },
  "nav.employees": { en: "Employee Directory", hinglish: "Staff Directory (टीम)", hi: "कर्मचारी डायरेक्टरी" },
  "nav.users": { en: "All Users", hinglish: "User Accounts", hi: "सभी यूजर" },
  "nav.task_assign": { en: "Task Assignment", hinglish: "Task Banto", hi: "कार्य आवंटन" },
  "nav.roles": { en: "Team Roles", hinglish: "Team Roles & Permissions", hi: "भूमिकाएं एवं अधिकार" },
  "nav.team_attendance": { en: "Team Attendance", hinglish: "Team ki Attendance", hi: "टीम उपस्थिति" },
  "nav.team_report": { en: "Team Task Report", hinglish: "Team Task Report", hi: "टीम कार्य रिपोर्ट" },
  "nav.notifications": { en: "Send Notifications", hinglish: "Notice / Message Bhejo", hi: "सूचनाएं भेजें" },
  "nav.profile": { en: "My Profile", hinglish: "Meri Profile", hi: "मेरी प्रोफाइल" },
  "nav.settings": { en: "Settings", hinglish: "Settings", hi: "सेटिंग्स" },

  // Header / Topbar
  "header.search": { en: "Search CRM...", hinglish: "Search karein...", hi: "खोजें..." },
  "header.signout": { en: "Sign Out", hinglish: "Log Out Karein", hi: "लॉग आउट" },

  // Role Badges
  "role.admin": { en: "Admin", hinglish: "Admin (मालिक)", hi: "व्यवस्थापक (Admin)" },
  "role.owner": { en: "Owner", hinglish: "Owner (मालिक)", hi: "मालिक (Owner)" },
  "role.caller": { en: "Telecaller", hinglish: "Telecaller (कॉलर)", hi: "टेलीकॉलर" },
  "role.tl": { en: "Team Leader", hinglish: "Team Leader (TL)", hi: "टीम लीडर" },
  "role.hr": { en: "HR Manager", hinglish: "HR Manager", hi: "एचआर मैनेजर" },

  // Leads Page Buttons & Headers
  "leads.title": { en: "Leads Management", hinglish: "Leads Management (कॉलिंग लिस्ट)", hi: "लीड्स प्रबंधन" },
  "leads.myleads": { en: "My Leads", hinglish: "Meri Assigned Leads", hi: "मेरी असाइन लीड्स" },
  "leads.add": { en: "+ Add Lead", hinglish: "+ Nayi Lead Daalo", hi: "+ नई लीड जोड़ें" },
  "leads.import": { en: "Import Leads", hinglish: "Excel Import", hi: "एक्सेल आयात (Import)" },
  "leads.export": { en: "Export", hinglish: "Excel Export", hi: "निर्यात (Export)" },
  "leads.assign": { en: "Assign to Agent", hinglish: "Caller ko Do", hi: "कॉलर को सौंपें" },
  "leads.call": { en: "Call Now", hinglish: "Call Lagao", hi: "कॉल करें" },
  "leads.whatsapp": { en: "WhatsApp", hinglish: "WhatsApp Bhejo", hi: "व्हाट्सएप भेजें" },
  "leads.status": { en: "Status", hinglish: "Call Status", hi: "स्थिति" },
  "leads.stage": { en: "Stage", hinglish: "Lead Stage", hi: "चरण" },

  // Employee Directory
  "emp.title": { en: "Employee Directory", hinglish: "Employee Directory (स्टाफ लिस्ट)", hi: "कर्मचारी डायरेक्टरी" },
  "emp.add": { en: "+ Add Employee / Agent", hinglish: "+ Naya Employee Banayein", hi: "+ नया कर्मचारी जोड़ें" },
  "emp.all": { en: "All Staff", hinglish: "Sabhi Staff", hi: "सभी कर्मचारी" },
  "emp.callers": { en: "Telecallers Only", hinglish: "Sirf Callers", hi: "केवल टेलीकॉलर" },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "hinglish",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("sultan_crm_lang") as Language;
    return saved === "en" || saved === "hinglish" || saved === "hi" ? saved : "hinglish";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("sultan_crm_lang", lang);
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
