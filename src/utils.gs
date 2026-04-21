/**
 * utils.gs
 * 共通ヘルパー関数群
 */

function getSheetByName(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet not found: " + sheetName);
  }
  return sheet;
}

function getHeaderRow(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  const headerRange = sheet.getRange(2, 1, 1, lastCol);
  return headerRange.getValues()[0];
}

function findColumnIndex(headers, columnName) {
  const index = headers.indexOf(columnName);
  return index >= 0 ? index + 1 : -1;
}

function rowToObject(headers, rowValues) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = rowValues[idx] || "";
  });
  return obj;
}

function normalizeBoolean(value) {
  if (value === true) return true;
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    return upper === "TRUE" || upper === "YES" || upper === "OK";
  }
  return false;
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function getRowsByColumn(sheet, columnName, value) {
  const headers = getHeaderRow(sheet);
  const colIndex = findColumnIndex(headers, columnName);
  
  if (colIndex === -1) {
    throw new Error("Column not found: " + columnName);
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 2) return [];
  
  const dataRange = sheet.getRange(3, 1, lastRow - 2, headers.length);
  const values = dataRange.getValues();
  
  const results = [];
  values.forEach((rowValues, idx) => {
    if (rowValues[colIndex - 1] === value) {
      results.push({
        rowIndex: 3 + idx,
        data: rowToObject(headers, rowValues)
      });
    }
  });
  
  return results;
}

function getRowsAsObjects(sheet, startRow, endRow) {
  const headers = getHeaderRow(sheet);
  if (endRow < startRow) return [];
  
  const numRows = endRow - startRow + 1;
  const dataRange = sheet.getRange(startRow, 1, numRows, headers.length);
  const values = dataRange.getValues();
  
  return values.map((rowValues, idx) => ({
    rowIndex: startRow + idx,
    data: rowToObject(headers, rowValues)
  }));
}

function getLastRowNum(sheet) {
  return sheet.getLastRow();
}

function updateRow(sheet, rowIndex, updates, headers) {
  Object.keys(updates).forEach(columnName => {
    const colIndex = findColumnIndex(headers, columnName);
    if (colIndex === -1) {
      throw new Error("Column not found: " + columnName);
    }
    sheet.getRange(rowIndex, colIndex).setValue(updates[columnName]);
  });
}

function appendRow(sheet, rowData, headers) {
  const newRow = [];
  headers.forEach(header => {
    newRow.push(rowData[header] || "");
  });
  sheet.appendRow(newRow);
}

function deleteRow(sheet, rowIndex) {
  sheet.deleteRow(rowIndex);
}

function log(level, message) {
  Logger.log("[" + level + "] " + message);
}
