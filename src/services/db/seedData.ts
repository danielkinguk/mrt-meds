import { db } from './database';
import type { Medicine, Batch, Item, Location, MedicineForm, MedicineRoute, MedicineCategory } from '../../types';

// MRT Drugs and Medical Equipment Formulary - EXACT 38 ITEMS ONLY
const formulary = [
  // Gases and Cylinders
  { name: "Oxygen Cylinder (a)", form: "Gas cylinder", dose: "15 L/min via mask", use: "hypoxia/respiratory support" },
  { name: "Entonox Cylinder (b)", form: "Gas cylinder", dose: "Self-administered inhalation", use: "pain relief" },
  
  // Injectable Medications
  { name: "Adrenaline", form: "Injection (IM)", dose: "1:1000, 0.5–1 mg IM", use: "anaphylaxis/cardiac arrest" },
  { name: "Aspirin", form: "Tablet", dose: "300 mg PO", use: "suspected MI/ACS" },
  { name: "Prochlorperazine", form: "Buccal tablet", dose: "3 mg buccal", use: "nausea/vertigo" },
  { name: "Co-Amoxiclav", form: "Tablet", dose: "625 mg PO", use: "bacterial infection" },
  { name: "Glucagon", form: "Injection", dose: "1 mg IM/SC", use: "severe hypoglycaemia" },
  { name: "GTN Spray", form: "Spray (sublingual)", dose: "400 mcg SL", use: "angina/chest pain" },
  { name: "Ibuprofen", form: "Tablet", dose: "400 mg PO", use: "pain/inflammation" },
  { name: "Ipratropium Nebules", form: "Nebuliser solution", dose: "500 mcg nebulised", use: "bronchospasm/COPD" },
  { name: "Midazolam", form: "Injection", dose: "5–10 mg IM/buccal", use: "seizures/sedation" },
  { name: "Morphine Ampules (10mg)", form: "Ampoule", dose: "10 mg IM/IV", use: "pain relief" },
  { name: "Naloxone", form: "Injection (IM/IN)", dose: "400 mcg IM or 800 mcg IN", use: "opioid overdose reversal" },
  { name: "Paracetamol", form: "Tablet", dose: "1 g PO", use: "pain/fever" },
  { name: "Salbutamol Inhaler (a)", form: "Inhaler", dose: "100 mcg per puff", use: "bronchospasm/asthma" },
  { name: "Salbutamol Inhaler (b)", form: "Inhaler", dose: "100 mcg per puff", use: "bronchospasm/asthma" },
  { name: "Salbutamol Nebules", form: "Nebuliser solution", dose: "2.5 mg nebulised", use: "severe bronchospasm" },
  
  // AED Equipment
  { name: "AED Batteries (a)", form: "Battery pack", dose: "N/A", use: "AED power supply" },
  { name: "AED Batteries (b)", form: "Battery pack", dose: "N/A", use: "AED power supply" },
  { name: "AED Pads (a)", form: "Electrode pads", dose: "N/A", use: "defibrillation" },
  { name: "AED Pads (b)", form: "Electrode pads", dose: "N/A", use: "defibrillation" },
  { name: "AED Check", form: "Test equipment", dose: "N/A", use: "AED functionality test" },
  
  // Consumables & Supplies
  { name: "Antiseptic Wipes", form: "Antiseptic wipe", dose: "Single use", use: "skin disinfection" },
  { name: "NPAs", form: "Nasal airway", dose: "Various sizes", use: "airway management" },
  { name: "OPAs", form: "Oral airway", dose: "Various sizes", use: "airway management" },
  { name: "Optilube", form: "Lubricant gel", dose: "As required", use: "airway/catheter lubrication" },
  { name: "Penthrox", form: "Inhaler", dose: "3 mL self-administered", use: "trauma pain relief" },
  { name: "Steripods", form: "Saline pods", dose: "20ml sterile saline", use: "wound irrigation/cleaning" },
  { name: "Fentanyl Lozenge", form: "Buccal lozenge", dose: "200–400 mcg buccal", use: "severe pain" },
  { name: "Syringe Sets", form: "Medical consumable", dose: "Various sizes", use: "drug administration" },
  { name: "Haemostatic Dressings", form: "Wound dressing", dose: "As required", use: "severe bleeding control" },
  { name: "Chest Decompression Needle", form: "Medical device", dose: "14G needle", use: "tension pneumothorax" },
  { name: "TXA", form: "Injection (IV)", dose: "1 g IV", use: "trauma bleeding/haemorrhage" },
  { name: "Chest Seal (Russel)", form: "Occlusive dressing", dose: "N/A", use: "penetrating chest wound" },
  { name: "I-gel (Yellow)", form: "Supraglottic airway", dose: "Size 3", use: "advanced airway" },
  { name: "I-gel (Green)", form: "Supraglottic airway", dose: "Size 4", use: "advanced airway" },
  { name: "I-gel (Orange)", form: "Supraglottic airway", dose: "Size 5", use: "advanced airway" },
  
  // Additional Medication
  { name: "Viagra", form: "Tablet", dose: "50 mg PO", use: "pulmonary hypertension/altitude sickness" },
];

// Helper function to parse form to structured data
function parseForm(formString: string): { form: MedicineForm; route: MedicineRoute } {
  const formLower = formString.toLowerCase();
  
  let form: MedicineForm = 'tablet';
  let route: MedicineRoute = 'oral';
  
  // Equipment and Devices
  if (formLower.includes('cylinder')) {
    form = 'cylinder';
    route = 'inhaled';
  } else if (formLower.includes('battery')) {
    form = 'battery';
    route = 'topical'; // N/A route for equipment
  } else if (formLower.includes('electrode') || formLower.includes('pads')) {
    form = 'electrode';
    route = 'topical';
  } else if (formLower.includes('test equipment') || formLower.includes('check')) {
    form = 'equipment';
    route = 'topical';
  } else if (formLower.includes('airway') || formLower.includes('supraglottic')) {
    form = 'airway';
    route = 'oral';
  } else if (formLower.includes('needle') || formLower.includes('device')) {
    form = 'device';
    route = 'subcutaneous';
  } else if (formLower.includes('dressing') || formLower.includes('seal')) {
    form = 'dressing';
    route = 'topical';
  } else if (formLower.includes('wipe') || formLower.includes('pods') || formLower.includes('consumable')) {
    form = 'consumable';
    route = 'topical';
  
  // Medications
  } else if (formLower.includes('injection')) {
    form = 'injection';
    if (formLower.includes('iv')) route = 'intravenous';
    else if (formLower.includes('im')) route = 'intramuscular';
    else if (formLower.includes('sc')) route = 'subcutaneous';
    else if (formLower.includes('in')) route = 'nasal';
    else route = 'intramuscular';
  } else if (formLower.includes('ampoule')) {
    form = 'ampoule';
    route = 'intramuscular';
  } else if (formLower.includes('tablet')) {
    form = 'tablet';
    if (formLower.includes('buccal')) route = 'buccal';
    else if (formLower.includes('sublingual') || formLower.includes('sl')) route = 'sublingual';
    else route = 'oral';
  } else if (formLower.includes('spray')) {
    form = 'spray';
    if (formLower.includes('sublingual') || formLower.includes('sl')) route = 'sublingual';
    else if (formLower.includes('nasal')) route = 'nasal';
    else route = 'sublingual';
  } else if (formLower.includes('inhaler')) {
    form = 'inhaler';
    route = 'inhaled';
  } else if (formLower.includes('nebuliser')) {
    form = 'nebule';
    route = 'nebulised';
  } else if (formLower.includes('lozenge')) {
    form = 'tablet';
    route = 'buccal';
  } else if (formLower.includes('gel')) {
    form = 'gel';
    if (formLower.includes('lubricant')) route = 'topical';
    else route = 'oral';
  }
  
  return { form, route };
}

// Helper function to determine category based on use
function determineCategory(use: string): MedicineCategory {
  const useLower = use.toLowerCase();
  
  // Equipment categories
  if (useLower.includes('aed') || useLower.includes('defibrillation') || useLower.includes('power supply')) return 'equipment';
  if (useLower.includes('airway') || useLower.includes('advanced airway') || useLower.includes('lubrication')) return 'airway';
  if (useLower.includes('trauma') || useLower.includes('bleeding') || useLower.includes('pneumothorax') || useLower.includes('chest wound')) return 'trauma';
  if (useLower.includes('disinfection') || useLower.includes('cleaning') || useLower.includes('irrigation') || useLower.includes('administration')) return 'consumable';
  if (useLower.includes('test') || useLower.includes('functionality')) return 'equipment';
  
  // Medication categories
  if (useLower.includes('pain') || useLower.includes('analgesia') || useLower.includes('relief')) return 'analgesic';
  if (useLower.includes('infection') || useLower.includes('bacterial')) return 'antibiotic';
  if (useLower.includes('nausea') || useLower.includes('antiemetic') || useLower.includes('vertigo')) return 'antiemetic';
  if (useLower.includes('anaphylaxis') || useLower.includes('allergy')) return 'emergency';
  if (useLower.includes('mi') || useLower.includes('angina') || useLower.includes('cardiac') || useLower.includes('chest pain')) return 'cardiac';
  if (useLower.includes('bronchospasm') || useLower.includes('asthma') || useLower.includes('hypoxia') || useLower.includes('respiratory') || useLower.includes('copd')) return 'respiratory';
  if (useLower.includes('seizure') || useLower.includes('sedation')) return 'sedative';
  if (useLower.includes('overdose') || useLower.includes('reversal') || useLower.includes('cardiac arrest')) return 'emergency';
  if (useLower.includes('hypoglycaemia') || useLower.includes('glucose')) return 'emergency';
  if (useLower.includes('fever')) return 'other';
  
  return 'other';
}

// Helper function to determine if controlled drug
function isControlledDrug(name: string): boolean {
  const controlled = ['morphine', 'fentanyl', 'midazolam', 'entonox', 'penthrox'];
  return controlled.some(drug => name.toLowerCase().includes(drug));
}

// Helper function to extract strength from dose string
function extractStrength(dose: string): string {
  const match = dose.match(/(\d+(?:\.\d+)?(?:–\d+(?:\.\d+)?)?\s*(?:mg|mcg|g|mL|L))/i);
  return match ? match[1] : dose.split(' ')[0];
}

// Helper function to generate random expiry date
function generateExpiryDate(monthsAhead: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  return date;
}

// Helper function to generate lot number
function generateLotNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let lot = '';
  for (let i = 0; i < 8; i++) {
    lot += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lot;
}

export async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    // Clear existing data (optional - comment out if you want to preserve existing data)
    await db.transaction('rw', db.medicines, db.batches, db.items, db.locations, async () => {
      await db.medicines.clear();
      await db.batches.clear();
      await db.items.clear();
    });
    
    // Create additional locations for kits and vehicles
    const locations: Location[] = [
      { id: 'dm-1', name: 'DM 1', type: 'vehicle', parentId: 'base-1', description: 'Deputy Manager 1', isActive: true, sortOrder: 4 },
      { id: 'dm-2', name: 'DM 2', type: 'vehicle', parentId: 'base-1', description: 'Deputy Manager 2', isActive: true, sortOrder: 5 },
      { id: 'vehicle-1', name: 'DM 1 Red Bag', type: 'vehicle', parentId: 'dm-1', description: 'Deputy Manager 1 red bag', isActive: true, sortOrder: 12 },
      { id: 'vehicle-2', name: 'DM 2 Red Bag', type: 'vehicle', parentId: 'dm-2', description: 'Deputy Manager 2 red bag', isActive: true, sortOrder: 13 },
      { id: 'vehicle-3', name: 'DM 1 Blue Bag', type: 'vehicle', parentId: 'dm-1', description: 'Deputy Manager 1 blue bag', isActive: true, sortOrder: 14 },
      { id: 'vehicle-4', name: 'DM 2 Blue Bag', type: 'vehicle', parentId: 'dm-2', description: 'Deputy Manager 2 blue bag', isActive: true, sortOrder: 15 },
      { id: 'kit-1', name: 'Primary Response Kit', type: 'kit', parentId: 'vehicle-1', description: 'Main medical kit', isActive: true, sortOrder: 20 },
      { id: 'kit-2', name: 'Backup Kit', type: 'kit', parentId: 'vehicle-3', description: 'Backup medical supplies', isActive: true, sortOrder: 21 },
      { id: 'pouch-1', name: 'Drugs Pouch', type: 'pouch', parentId: 'kit-1', description: 'Non-controlled drugs', isActive: true, sortOrder: 30 },
      { id: 'pouch-2', name: 'Airway Pouch', type: 'pouch', parentId: 'kit-1', description: 'Airway management', isActive: true, sortOrder: 31 },
    ];
    
    await db.locations.bulkAdd(locations);
    
    // Process formulary data
    const medicines: Medicine[] = [];
    const batches: Batch[] = [];
    const items: Item[] = [];
    
    for (const drug of formulary) {
      const { form, route } = parseForm(drug.form);
      const category = determineCategory(drug.use);
      const controlled = isControlledDrug(drug.name);
      const strength = extractStrength(drug.dose);
      
      // Determine storage requirements
      let storageRequirements = '';
      if (drug.name.includes('Oxygen')) {
        storageRequirements = 'Store upright in well-ventilated area. Keep away from heat sources.';
      } else if (controlled) {
        storageRequirements = 'Controlled drug - secure storage required. Double-locked cabinet.';
      } else if (form === 'injection' || form === 'liquid') {
        storageRequirements = 'Store below 25°C. Protect from light.';
      } else if (drug.name === 'Glucose Gel') {
        storageRequirements = 'Store at room temperature. Do not freeze.';
      }
      
      // Set stock levels based on drug type
      let minStock = 5;
      let maxStock = 20;
      
      if (controlled) {
        minStock = 2;
        maxStock = 10;
      } else if (category === 'emergency') {
        minStock = 10;
        maxStock = 30;
      } else if (drug.name === 'Oxygen') {
        minStock = 2;
        maxStock = 5;
      }
      
      const medicine: Medicine = {
        id: `med-${medicines.length + 1}`,
        name: drug.name,
        strength,
        form,
        route,
        category,
        isControlled: controlled,
        minStock,
        maxStock,
        storageRequirements: storageRequirements || undefined,
        notes: `${drug.use}. Standard dose: ${drug.dose}`
      };
      
      medicines.push(medicine);
      
      // Create 2-3 batches per medicine with varying expiry dates
      const numBatches = Math.floor(Math.random() * 2) + 2;
      
      for (let b = 0; b < numBatches; b++) {
        // Vary expiry dates: some expired, some expiring soon, most OK
        let monthsAhead = Math.floor(Math.random() * 24) + 1;
        if (b === 0 && Math.random() < 0.1) {
          monthsAhead = -1; // 10% chance of expired batch
        } else if (b === 1 && Math.random() < 0.2) {
          monthsAhead = 1; // 20% chance of expiring very soon
        }
        
        const batch: Batch = {
          id: `batch-${batches.length + 1}`,
          medicineId: medicine.id,
          lotNumber: generateLotNumber(),
          expiryDate: generateExpiryDate(monthsAhead),
          manufacturer: ['Pfizer', 'GSK', 'AstraZeneca', 'Roche', 'Sanofi'][Math.floor(Math.random() * 5)],
          receivedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Within last 90 days
          quantity: 5,
          supplierName: 'NHS Supply Chain',
          invoiceNumber: `INV-${Math.floor(Math.random() * 100000)}`
        };
        
        batches.push(batch);
        
        // Create items for this batch
        const numItems = Math.min(batch.quantity, Math.floor(Math.random() * 10) + 3);
        
        for (let i = 0; i < numItems; i++) {
          // Distribute items across locations
          let locationId = 'cabinet-1'; // Default to drug cabinet
          
          if (controlled) {
            locationId = 'cabinet-1'; // Controlled drugs in Drug Safe
          } else if (drug.name === 'Oxygen') {
            const vehicles = ['vehicle-1', 'vehicle-2', 'vehicle-3', 'vehicle-4'];
            locationId = vehicles[Math.floor(Math.random() * vehicles.length)];
          } else if (category === 'emergency') {
            locationId = ['kit-1', 'kit-2'][Math.floor(Math.random() * 2)];
          } else if (form === 'injection') {
            locationId = 'pouch-1'; // Moved injections to Drugs Pouch
          } else if (route === 'inhaled' || route === 'nebulised') {
            locationId = 'pouch-2';
          } else {
            // Random distribution for other items, including Store
            const locs = ['cabinet-1', 'kit-1', 'kit-2', 'store-1'];
            locationId = locs[Math.floor(Math.random() * locs.length)];
          }
          
          const item: Item = {
            id: `item-${items.length + 1}`,
            batchId: batch.id,
            medicineId: medicine.id,
            locationId,
            status: 'available',
            addedDate: batch.receivedDate,
            lastCheckedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
          };
          
          items.push(item);
        }
      }
    }
    
    // Save all data to database
    await db.medicines.bulkAdd(medicines);
    await db.batches.bulkAdd(batches);
    await db.items.bulkAdd(items);
    
    console.log(`Database seeded successfully!`);
    console.log(`- ${medicines.length} medicines`);
    console.log(`- ${batches.length} batches`);
    console.log(`- ${items.length} items`);
    console.log(`- ${locations.length} additional locations`);
    
    return {
      medicines: medicines.length,
      batches: batches.length,
      items: items.length,
      locations: locations.length
    };
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}

export async function resetAndSeed() {
  try {
    await db.clearAllData();
    await db.initializeDefaults();
    return await seedDatabase();
  } catch (error) {
    console.error('Failed to reset and seed database:', error);
    throw error;
  }
}