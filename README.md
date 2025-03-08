# Airtable Vendor Document Processor Fix

This repository contains a fix for the error:
```
Can't create records: invalid cell value for field 'Unit'.
Cell value has invalid format: <root> must be an object
Single select field value must be an object with at least one of 'id' or 'name' as a property.
```

## The Issue

The error occurs because the script is trying to set a string value directly for the 'Unit' field, but in Airtable, single select fields require an object format with a name property: `{ name: "value" }`.

## How to Fix the Issue

There are two parts to the fix:

### 1. Update the field definition

In your script, find the `globalPoTableFields` array and change the type of the 'Unit' field from 'string' to 'singleSelect':

```javascript
const globalPoTableFields = [
    // other fields...
    { name: 'Unit', type: 'singleSelect' }, // Changed from 'string' to 'singleSelect'
    // other fields...
];
```

### 2. Update the field value processing

Add a case for 'singleSelect' type in the `processFieldValue` function:

```javascript
function processFieldValue(value, fieldType) {
  if (value == null || value === '') return null;
  
  const stringValue = String(value);
  
  switch (fieldType) {
    // other cases...
    case "singleSelect": 
      // Format single select fields as objects with name property
      return { name: stringValue };
    default:
      return stringValue;
  }
}
```

### Alternative Approach

If you continue to have issues, you can also modify the `createOrUpdateRecordForRow` function to specifically handle the Unit field:

```javascript
// Special case for single select fields
if (fieldType === "singleSelect" || key === "Unit") {
    // For single select fields, format as an object with name property
    if (cellValue !== null && cellValue !== undefined) {
        fieldsToUpdate[key] = { name: String(cellValue) };
    }
} 
```

## Implementation

1. Locate these sections in your script
2. Make the necessary changes as described above
3. Save and run the script again

## Additional Notes

- This fix assumes that the 'Unit' field is the only single select field causing issues
- If you have other single select fields, make sure they are also properly typed in the `globalPoTableFields` array
- Always back up your script before making changes

## Support

If you encounter any other issues after implementing these fixes, please examine Airtable's error messages carefully, as they often provide clues about what's wrong with the field formatting.
