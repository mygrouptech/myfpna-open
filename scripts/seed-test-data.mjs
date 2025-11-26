import { drizzle } from "drizzle-orm/mysql2";
import { budgetLineItems, actuals } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

// Realistic budget line items for a full year (2025)
const budgetData = [
  // Personnel - Q1
  { accountName: "Executive Salaries", category: "Personnel", period: "2025-01-01", amount: 250000 },
  { accountName: "Engineering Salaries", category: "Personnel", period: "2025-01-01", amount: 450000 },
  { accountName: "Sales Salaries", category: "Personnel", period: "2025-01-01", amount: 180000 },
  { accountName: "Marketing Salaries", category: "Personnel", period: "2025-01-01", amount: 120000 },
  { accountName: "Employee Benefits", category: "Personnel", period: "2025-01-01", amount: 150000 },
  { accountName: "Payroll Taxes", category: "Personnel", period: "2025-01-01", amount: 95000 },
  
  // Personnel - Q2
  { accountName: "Executive Salaries", category: "Personnel", period: "2025-04-01", amount: 250000 },
  { accountName: "Engineering Salaries", category: "Personnel", period: "2025-04-01", amount: 480000 }, // Hiring increase
  { accountName: "Sales Salaries", category: "Personnel", period: "2025-04-01", amount: 200000 },
  { accountName: "Marketing Salaries", category: "Personnel", period: "2025-04-01", amount: 130000 },
  { accountName: "Employee Benefits", category: "Personnel", period: "2025-04-01", amount: 160000 },
  { accountName: "Payroll Taxes", category: "Personnel", period: "2025-04-01", amount: 102000 },
  
  // Operations - Q1
  { accountName: "Office Rent", category: "Operations", period: "2025-01-01", amount: 45000 },
  { accountName: "Utilities", category: "Operations", period: "2025-01-01", amount: 8000 },
  { accountName: "Office Supplies", category: "Operations", period: "2025-01-01", amount: 5000 },
  { accountName: "Equipment Lease", category: "Operations", period: "2025-01-01", amount: 12000 },
  { accountName: "Insurance", category: "Operations", period: "2025-01-01", amount: 15000 },
  
  // Operations - Q2
  { accountName: "Office Rent", category: "Operations", period: "2025-04-01", amount: 45000 },
  { accountName: "Utilities", category: "Operations", period: "2025-04-01", amount: 9000 },
  { accountName: "Office Supplies", category: "Operations", period: "2025-04-01", amount: 6000 },
  { accountName: "Equipment Lease", category: "Operations", period: "2025-04-01", amount: 12000 },
  
  // Marketing - Q1
  { accountName: "Digital Advertising", category: "Marketing", period: "2025-01-01", amount: 75000 },
  { accountName: "Content Marketing", category: "Marketing", period: "2025-01-01", amount: 25000 },
  { accountName: "Events & Conferences", category: "Marketing", period: "2025-01-01", amount: 40000 },
  { accountName: "Marketing Tools & Software", category: "Marketing", period: "2025-01-01", amount: 15000 },
  
  // Marketing - Q2
  { accountName: "Digital Advertising", category: "Marketing", period: "2025-04-01", amount: 85000 },
  { accountName: "Content Marketing", category: "Marketing", period: "2025-04-01", amount: 30000 },
  { accountName: "Events & Conferences", category: "Marketing", period: "2025-04-01", amount: 50000 },
  { accountName: "Marketing Tools & Software", category: "Marketing", period: "2025-04-01", amount: 15000 },
  
  // IT & Technology - Q1
  { accountName: "Cloud Infrastructure (AWS/Azure)", category: "IT", period: "2025-01-01", amount: 35000 },
  { accountName: "Software Licenses", category: "IT", period: "2025-01-01", amount: 20000 },
  { accountName: "IT Support & Maintenance", category: "IT", period: "2025-01-01", amount: 12000 },
  { accountName: "Cybersecurity", category: "IT", period: "2025-01-01", amount: 18000 },
  
  // IT & Technology - Q2
  { accountName: "Cloud Infrastructure (AWS/Azure)", category: "IT", period: "2025-04-01", amount: 40000 },
  { accountName: "Software Licenses", category: "IT", period: "2025-04-01", amount: 22000 },
  { accountName: "IT Support & Maintenance", category: "IT", period: "2025-04-01", amount: 12000 },
  { accountName: "Cybersecurity", category: "IT", period: "2025-04-01", amount: 18000 },
];

// Actuals data (slightly different from budget to show variance)
const actualsData = [
  // Q1 Actuals - some over, some under budget
  { accountName: "Executive Salaries", category: "Personnel", period: "2025-01-01", amount: 250000 },
  { accountName: "Engineering Salaries", category: "Personnel", period: "2025-01-01", amount: 465000 }, // Over budget
  { accountName: "Sales Salaries", category: "Personnel", period: "2025-01-01", amount: 175000 }, // Under budget
  { accountName: "Marketing Salaries", category: "Personnel", period: "2025-01-01", amount: 120000 },
  { accountName: "Employee Benefits", category: "Personnel", period: "2025-01-01", amount: 155000 },
  { accountName: "Payroll Taxes", category: "Personnel", period: "2025-01-01", amount: 97000 },
  
  { accountName: "Office Rent", category: "Operations", period: "2025-01-01", amount: 45000 },
  { accountName: "Utilities", category: "Operations", period: "2025-01-01", amount: 8500 },
  { accountName: "Office Supplies", category: "Operations", period: "2025-01-01", amount: 4200 }, // Under budget
  { accountName: "Equipment Lease", category: "Operations", period: "2025-01-01", amount: 12000 },
  { accountName: "Insurance", category: "Operations", period: "2025-01-01", amount: 15000 },
  
  { accountName: "Digital Advertising", category: "Marketing", period: "2025-01-01", amount: 82000 }, // Over budget
  { accountName: "Content Marketing", category: "Marketing", period: "2025-01-01", amount: 23000 },
  { accountName: "Events & Conferences", category: "Marketing", period: "2025-01-01", amount: 38000 },
  { accountName: "Marketing Tools & Software", category: "Marketing", period: "2025-01-01", amount: 15500 },
  
  { accountName: "Cloud Infrastructure (AWS/Azure)", category: "IT", period: "2025-01-01", amount: 37000 },
  { accountName: "Software Licenses", category: "IT", period: "2025-01-01", amount: 20000 },
  { accountName: "IT Support & Maintenance", category: "IT", period: "2025-01-01", amount: 11000 },
  { accountName: "Cybersecurity", category: "IT", period: "2025-01-01", amount: 18000 },
];

async function seedTestData() {
  const scenarioId = 90001; // The new test scenario
  
  console.log("Seeding budget line items...");
  
  for (const item of budgetData) {
    await db.insert(budgetLineItems).values({
      scenarioId,
      accountName: item.accountName,
      category: item.category,
      period: new Date(item.period),
      amount: item.amount * 100, // Convert to cents
    });
  }
  
  console.log(`✅ Created ${budgetData.length} budget line items`);
  
  console.log("Seeding actuals data...");
  
  for (const item of actualsData) {
    await db.insert(actuals).values({
      scenarioId,
      accountName: item.accountName,
      category: item.category,
      period: new Date(item.period),
      actualAmount: item.amount * 100, // Convert to cents
    });
  }
  
  console.log(`✅ Created ${actualsData.length} actuals records`);
  console.log("🎉 Test data seeding complete!");
  
  process.exit(0);
}

seedTestData().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});
