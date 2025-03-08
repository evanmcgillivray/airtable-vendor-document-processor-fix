// Fix for the vendor document processor script
// This addresses the "invalid cell value for field 'Unit'" error

// The main issue is that the 'Unit' field is defined as a string type but in Airtable 
// it's actually a single select field, which requires an object with a name property.

// Here are the key fixes:

// 1. Update the globalPoTableFields definition to mark 'Unit' as a 'singleSelect' type
const globalPoTableFields = [
    { name: 'Date - Out', type: 'date', dateFormat: 'MM/dd/YYYY' },
    { name: 'Date - In', type: 'date', dateFormat: 'MM/dd/YYYY' },
    { name: 'Non-Catalog', type: 'linkedRecord' },
    { name: 'SKU', type: 'string' },
    { name: 'Qty', type: 'number', derivateType: 'calculateDivision' },
    { name: 'Rate', type: 'number', derivateType: 'calculateDivision' },
    { name: "X", type: 'number', derivateType: 'calculateDivision' },
    { name: "Discount.%", type: 'percentage', derivateType: 'calculateDiscount' },
    { name: "Discount", type: 'number', derivateType: 'calculateDiscount' },
    { name: 'Row Total', type: 'total' },
    { name: 'Unit', type: 'singleSelect' }, // Changed from 'string' to 'singleSelect'
    { name: 'Tax.%', type: 'percentage' },
    { name: 'C.%', type: 'percentage'},
    { name: 'PO', type: 'string'},
    { name: 'Skip', type: 'skip' }
];

// 2. Update the processFieldValue function to handle single select fields properly
function processFieldValue(value, fieldType) {
  if (value == null || value === '') return null;
  
  const stringValue = String(value);
  
  switch (fieldType) {
    case "date":
      return handleDateField(stringValue);
    case "number":
      if (stringValue.match(/NC|TBD|INC/i)) return 0;
      const numValue = Number(stringValue.replace(/[$,%]/g, "").trim());
      return !isNaN(numValue) ? numValue : null;
    case "percentage":
      if (stringValue.match(/NC|TBD/i)) return 0;
      let percentValue = Number(stringValue.replace(/[$,%]/g, "").trim());
      if (!isNaN(percentValue)) {
        return percentValue > 1 ? percentValue / 100 : percentValue;
      }
      return null;
    case "linkedRecord":
      return value; // Handle linked records separately
    case "singleSelect": 
      // Format single select fields as objects with name property
      return { name: stringValue };
    default:
      return stringValue;
  }
}

// --- Alternative approach (in case the above changes don't fully resolve the issue) ---

// You could also modify the createOrUpdateRecordForRow function to specifically 
// handle the Unit field (and any other single select fields):

async function createOrUpdateRecordForRow(row, selectedPhase, projectPOTable, selectedVendor, nonCatalogRecord, additionalFields = {}) {
    let fieldsToUpdate = { ...additionalFields };

    for (let key in row.data) {
        // Skip the "Row Total" field, keep other derivative fields
        if (key === "Row Total") continue;
        
        let cellValue = row.data[key];
        let fieldType = row.mapType[key];
        
        // Special case for linked records
        if (fieldType === "linkedRecord") {
            if (key === "Non-Catalog" && nonCatalogRecord) {
                fieldsToUpdate[key] = [{ id: nonCatalogRecord.id }];
            }
        } 
        // Special case for single select fields
        else if (fieldType === "singleSelect" || key === "Unit") {
            // For single select fields, format as an object with name property
            if (cellValue !== null && cellValue !== undefined) {
                fieldsToUpdate[key] = { name: String(cellValue) };
            }
        } 
        else {
            // Process all other field types
            const processedValue = processFieldValue(cellValue, fieldType);
            if (processedValue !== null) {
                fieldsToUpdate[key] = processedValue;
            }
        }
    }

    // Rest of the function remains the same...
    let fieldsToUpdateNames = Object.keys(fieldsToUpdate);
    let existingRecords = await findRecordByNonCatalogId(projectPOTable, nonCatalogRecord.id, selectedVendor.id, fieldsToUpdateNames);
    
    // Process existing records or create new ones...
    // (Unchanged code omitted for brevity)
}
