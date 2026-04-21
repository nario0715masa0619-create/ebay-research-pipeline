/**
 * listing.gs
 * Listing シート の操作関数
 */

function getListingByResearchId(researchId) {
  const sheet = getSheetByName(LISTING_SHEET);
  const rows = getRowsByColumn(sheet, LISTING_COLUMNS.RESEARCH_ID, researchId);
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0];
}

function getAllListingRows() {
  const sheet = getSheetByName(LISTING_SHEET);
  const lastRow = getLastRowNum(sheet);
  
  if (lastRow <= HEADER_ROW_NUM) {
    return [];
  }
  
  return getRowsAsObjects(sheet, HEADER_ROW_NUM + 1, lastRow);
}

function appendListingRow(rowData) {
  const sheet = getSheetByName(LISTING_SHEET);
  const headers = getHeaderRow(sheet);
  appendRow(sheet, rowData, headers);
}

function deleteListingRow(rowIndex) {
  const sheet = getSheetByName(LISTING_SHEET);
  deleteRow(sheet, rowIndex);
}

function copyResearchToListing(researchRow) {
  const researchId = researchRow.data[RESEARCH_COLUMNS.RESEARCH_ID];
  
  const existingListing = getListingByResearchId(researchId);
  if (existingListing) {
    deleteListingRow(existingListing.rowIndex);
    log("INFO", "Deleted existing Listing row for " + researchId);
  }
  
  const listingData = {};
  listingData[LISTING_COLUMNS.SKU] = researchRow.data[RESEARCH_COLUMNS.SKU_CANDIDATE] || "";
  listingData[LISTING_COLUMNS.RESEARCH_ID] = researchId;
  listingData[LISTING_COLUMNS.PRICE] = researchRow.data[RESEARCH_COLUMNS.SELL_PRICE_AVG] || "";
  listingData[LISTING_COLUMNS.CURRENCY] = researchRow.data[RESEARCH_COLUMNS.CURRENCY] || "";
  listingData[LISTING_COLUMNS.QUANTITY] = 1;
  listingData[LISTING_COLUMNS.CONDITION] = "New";
  listingData[LISTING_COLUMNS.STATUS] = "draft";
  listingData[LISTING_COLUMNS.TITLE_EN] = "";
  listingData[LISTING_COLUMNS.DESCRIPTION_EN] = "";
  listingData[LISTING_COLUMNS.CATEGORY_ID] = "";
  listingData[LISTING_COLUMNS.MEMO] = "";
  
  appendListingRow(listingData);
  log("INFO", "Appended Listing row for " + researchId);
}

function syncResearchToListing() {
  const targetRows = getResearchRowsForListing();
  let count = 0;
  
  targetRows.forEach(row => {
    try {
      copyResearchToListing(row);
      count++;
    } catch (e) {
      log("ERROR", "Failed to sync " + row.data[RESEARCH_COLUMNS.RESEARCH_ID] + ": " + e.message);
    }
  });
  
  log("INFO", "Synced " + count + " rows to Listing sheet");
  return count;
}

function getApprovedListingRows() {
  const allRows = getAllListingRows();
  
  return allRows.filter(row => {
    const approved = row.data[LISTING_COLUMNS.APPROVED];
    return approved === "OK" || normalizeBoolean(approved);
  });
}
