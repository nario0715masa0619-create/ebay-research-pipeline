/**
 * research.gs
 * Research シート の操作関数
 */

function getResearchRow(researchId) {
  const sheet = getSheetByName(RESEARCH_SHEET);
  const rows = getRowsByColumn(sheet, RESEARCH_COLUMNS.RESEARCH_ID, researchId);
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0];
}

function getAllResearchRows() {
  const sheet = getSheetByName(RESEARCH_SHEET);
  const lastRow = getLastRowNum(sheet);
  
  if (lastRow <= HEADER_ROW_NUM) {
    return [];
  }
  
  return getRowsAsObjects(sheet, HEADER_ROW_NUM + 1, lastRow);
}

function updateResearchRow(rowIndex, updates) {
  const sheet = getSheetByName(RESEARCH_SHEET);
  const headers = getHeaderRow(sheet);
  updateRow(sheet, rowIndex, updates, headers);
}

function appendResearchRow(rowData) {
  const sheet = getSheetByName(RESEARCH_SHEET);
  const headers = getHeaderRow(sheet);
  appendRow(sheet, rowData, headers);
}

function deleteResearchRow(rowIndex) {
  const sheet = getSheetByName(RESEARCH_SHEET);
  deleteRow(sheet, rowIndex);
}

function reflectBestSourceOffer(researchId) {
  const bestOffer = findBestSourceOffer(researchId);
  
  if (!bestOffer) {
    log("WARN", "No valid source offer found for " + researchId);
    return false;
  }
  
  const researchRow = getResearchRow(researchId);
  if (!researchRow) {
    log("WARN", "Research row not found for " + researchId);
    return false;
  }
  
  const updates = {};
  updates[RESEARCH_COLUMNS.BEST_SOURCE_MARKET] = bestOffer.data[SOURCE_OFFERS_COLUMNS.SOURCE_MARKETPLACE];
  updates[RESEARCH_COLUMNS.BEST_SOURCE_PRICE] = bestOffer.data[SOURCE_OFFERS_COLUMNS.TOTAL_SOURCE_COST];
  updates[RESEARCH_COLUMNS.BEST_SOURCE_NOTE] = bestOffer.data[SOURCE_OFFERS_COLUMNS.SOURCE_URL] || "";
  
  updateResearchRow(researchRow.rowIndex, updates);
  log("INFO", "Updated RESEARCH_ID: " + researchId);
  
  return true;
}

function updateAllResearchFromSourceOffers() {
  const researchRows = getAllResearchRows();
  let count = 0;
  
  researchRows.forEach(row => {
    const researchId = row.data[RESEARCH_COLUMNS.RESEARCH_ID];
    if (reflectBestSourceOffer(researchId)) {
      count++;
    }
  });
  
  log("INFO", "Updated " + count + " research rows");
  return count;
}

function getResearchRowsForListing() {
  const allRows = getAllResearchRows();
  
  return allRows.filter(row => {
    const toListing = row.data[RESEARCH_COLUMNS.TO_LISTING];
    const profitOk = row.data[RESEARCH_COLUMNS.PROFIT_OK];
    
    const isToListingValid = normalizeBoolean(toListing);
    const isProfitOkValid = profitOk === "OK";
    
    return isToListingValid && isProfitOkValid;
  });
}
