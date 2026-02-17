export interface IndustryBenchmark {
  label: string;
  avgTicket: number;
  avgMonthlyLeads: number;
  afterHoursPercent: number;
}

export const INDUSTRIES: Record<string, IndustryBenchmark> = {
  "commercial-janitorial": {
    label: "Commercial/Janitorial Cleaning",
    avgTicket: 800,
    avgMonthlyLeads: 40,
    afterHoursPercent: 0.25,
  },
  "residential-maid": {
    label: "Residential Maid Services",
    avgTicket: 180,
    avgMonthlyLeads: 80,
    afterHoursPercent: 0.35,
  },
  "carpet-cleaning": {
    label: "Carpet Cleaning",
    avgTicket: 250,
    avgMonthlyLeads: 60,
    afterHoursPercent: 0.30,
  },
  "pressure-washing": {
    label: "Pressure Washing",
    avgTicket: 350,
    avgMonthlyLeads: 50,
    afterHoursPercent: 0.30,
  },
  "air-duct-hvac": {
    label: "Air Duct/HVAC Cleaning",
    avgTicket: 400,
    avgMonthlyLeads: 45,
    afterHoursPercent: 0.35,
  },
  "pool-cleaning": {
    label: "Pool Cleaning & Maintenance",
    avgTicket: 150,
    avgMonthlyLeads: 35,
    afterHoursPercent: 0.20,
  },
  "window-cleaning": {
    label: "Window Cleaning",
    avgTicket: 300,
    avgMonthlyLeads: 40,
    afterHoursPercent: 0.25,
  },
  "floor-restoration": {
    label: "Floor Restoration & Hard Surface",
    avgTicket: 1200,
    avgMonthlyLeads: 25,
    afterHoursPercent: 0.20,
  },
  "hood-cleaning": {
    label: "Hood/Kitchen Exhaust Cleaning",
    avgTicket: 450,
    avgMonthlyLeads: 30,
    afterHoursPercent: 0.15,
  },
  "pest-control": {
    label: "Pest Control",
    avgTicket: 175,
    avgMonthlyLeads: 70,
    afterHoursPercent: 0.40,
  },
  "facility-services": {
    label: "Facility Services",
    avgTicket: 2500,
    avgMonthlyLeads: 20,
    afterHoursPercent: 0.15,
  },
  "professional-organizing": {
    label: "Professional Organizing",
    avgTicket: 500,
    avgMonthlyLeads: 25,
    afterHoursPercent: 0.30,
  },
  "doors-gates": {
    label: "Doors/Gates",
    avgTicket: 650,
    avgMonthlyLeads: 40,
    afterHoursPercent: 0.30,
  },
  "welding": {
    label: "Welding",
    avgTicket: 800,
    avgMonthlyLeads: 30,
    afterHoursPercent: 0.15,
  },
  "hearing-aid-dealers": {
    label: "Hearing Aid Dealers",
    avgTicket: 3000,
    avgMonthlyLeads: 25,
    afterHoursPercent: 0.10,
  },
  "general-services": {
    label: "General Services",
    avgTicket: 300,
    avgMonthlyLeads: 40,
    afterHoursPercent: 0.25,
  },
};

export const INDUSTRY_OPTIONS = Object.entries(INDUSTRIES).map(
  ([value, { label }]) => ({ value, label })
);
