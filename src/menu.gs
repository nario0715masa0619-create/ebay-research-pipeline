/**
 * menu.gs
 * Google Sheets カスタムメニュー と メイン処理
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu(UI_TITLE)
    .addItem("SourceOffers から反映", "menuUpdateSourceOffers")
    .addItem("Listing へ転送", "menuSyncToListing")
    .addSeparator()
    .addItem("データ検証", "menuValidateData")
    .addToUi();
  
  log("INFO", "Custom menu created");
}

function menuUpdateSourceOffers() {
  try {
    const count = updateAllResearchFromSourceOffers();
    
    if (count === 0) {
      SpreadsheetApp.getUi().alert(UI_NO_DATA);
    } else {
      SpreadsheetApp.getUi().alert(count + " 件の Research 行を更新しました。");
    }
  } catch (error) {
    log("ERROR", error.message);
    SpreadsheetApp.getUi().alert(UI_ERROR_PREFIX + error.message);
  }
}

function menuSyncToListing() {
  try {
    const count = syncResearchToListing();
    
    if (count === 0) {
      SpreadsheetApp.getUi().alert(UI_NO_DATA);
    } else {
      SpreadsheetApp.getUi().alert(count + " 件を Listing に転送しました。");
    }
  } catch (error) {
    log("ERROR", error.message);
    SpreadsheetApp.getUi().alert(UI_ERROR_PREFIX + error.message);
  }
}

function menuValidateData() {
  try {
    const validationResult = validateAllData();
    
    let message = "データ検証結果:\n\n";
    message += "Research: " + (validationResult.research.valid ? "OK" : "ERROR") + "\n";
    if (!validationResult.research.valid) {
      message += "  " + validationResult.research.errors.join(", ") + "\n";
    }
    
    message += "SourceOffers: " + (validationResult.sourceOffers.valid ? "OK" : "ERROR") + "\n";
    if (!validationResult.sourceOffers.valid) {
      message += "  " + validationResult.sourceOffers.errors.join(", ") + "\n";
    }
    
    message += "Listing: " + (validationResult.listing.valid ? "OK" : "ERROR") + "\n";
    if (!validationResult.listing.valid) {
      message += "  " + validationResult.listing.errors.join(", ") + "\n";
    }
    
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    log("ERROR", error.message);
    SpreadsheetApp.getUi().alert(UI_ERROR_PREFIX + error.message);
  }
}

function validateAllData() {
  return {
    research: validateResearchSheet(),
    sourceOffers: validateSourceOffersSheet(),
    listing: validateListingSheet()
  };
}

function validateResearchSheet() {
  const errors = [];
  
  try {
    const sheet = getSheetByName(RESEARCH_SHEET);
    const headers = getHeaderRow(sheet);
    
    const requiredColumns = [
      RESEARCH_COLUMNS.RESEARCH_ID,
      RESEARCH_COLUMNS.SELL_PRICE_AVG,
      RESEARCH_COLUMNS.FEE_RATE_EBAY
    ];
    
    requiredColumns.forEach(col => {
      if (findColumnIndex(headers, col) === -1) {
        errors.push("Missing column: " + col);
      }
    });
    
    const lastRow = getLastRowNum(sheet);
    if (lastRow <= HEADER_ROW_NUM) {
      errors.push("No data rows found");
    }
  } catch (e) {
    errors.push(e.message);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function validateSourceOffersSheet() {
  const errors = [];
  
  try {
    const sheet = getSheetByName(SOURCE_OFFERS_SHEET);
    const headers = getHeaderRow(sheet);
    
    const requiredColumns = [
      SOURCE_OFFERS_COLUMNS.RESEARCH_ID,
      SOURCE_OFFERS_COLUMNS.TOTAL_SOURCE_COST
    ];
    
    requiredColumns.forEach(col => {
      if (findColumnIndex(headers, col) === -1) {
        errors.push("Missing column: " + col);
      }
    });
  } catch (e) {
    errors.push(e.message);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function validateListingSheet() {
  const errors = [];
  
  try {
    const sheet = getSheetByName(LISTING_SHEET);
    const headers = getHeaderRow(sheet);
    
    const requiredColumns = [
      LISTING_COLUMNS.RESEARCH_ID,
      LISTING_COLUMNS.SKU
    ];
    
    requiredColumns.forEach(col => {
      if (findColumnIndex(headers, col) === -1) {
        errors.push("Missing column: " + col);
      }
    });
  } catch (e) {
    errors.push(e.message);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function testAllFunctions() {
  Logger.log("=== Testing eBay Research Pipeline ===");
  
  try {
    Logger.log("Testing utils...");
    const sheet = getSheetByName(RESEARCH_SHEET);
    const headers = getHeaderRow(sheet);
    Logger.log("Headers: " + headers.join(", "));
    
    Logger.log("Testing research operations...");
    const allResearch = getAllResearchRows();
    Logger.log("Found " + allResearch.length + " research rows");
    
    Logger.log("Testing source offers operations...");
    const allSourceOffers = getAllSourceOfferRows();
    Logger.log("Found " + allSourceOffers.length + " source offer rows");
    
    Logger.log("Testing listing operations...");
    const allListing = getAllListingRows();
    Logger.log("Found " + allListing.length + " listing rows");
    
    Logger.log("=== All tests passed ===");
  } catch (error) {
    Logger.log("ERROR: " + error.message);
  }
}
