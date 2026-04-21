/**
 * source-offers.gs
 * SourceOffers シート の操作関数
 */

function getSourceOffersByResearchId(researchId) {
  const sheet = getSheetByName(SOURCE_OFFERS_SHEET);
  const rows = getRowsByColumn(sheet, SOURCE_OFFERS_COLUMNS.RESEARCH_ID, researchId);
  return rows;
}

function filterValidOffers(offers) {
  return offers.filter(offer => {
    const status = offer.data[SOURCE_OFFERS_COLUMNS.SOURCE_STATUS];
    return VALID_SOURCE_STATUS.includes(status);
  });
}

function findBestSourceOffer(researchId) {
  const offers = getSourceOffersByResearchId(researchId);
  
  if (offers.length === 0) {
    return null;
  }
  
  const validOffers = filterValidOffers(offers);
  
  if (validOffers.length === 0) {
    return null;
  }
  
  let bestOffer = validOffers[0];
  let minCost = toNumber(bestOffer.data[SOURCE_OFFERS_COLUMNS.TOTAL_SOURCE_COST]);
  
  validOffers.forEach(offer => {
    const cost = toNumber(offer.data[SOURCE_OFFERS_COLUMNS.TOTAL_SOURCE_COST]);
    if (cost < minCost) {
      bestOffer = offer;
      minCost = cost;
    }
  });
  
  return bestOffer;
}

function getAllSourceOfferRows() {
  const sheet = getSheetByName(SOURCE_OFFERS_SHEET);
  const lastRow = getLastRowNum(sheet);
  
  if (lastRow <= HEADER_ROW_NUM) {
    return [];
  }
  
  return getRowsAsObjects(sheet, HEADER_ROW_NUM + 1, lastRow);
}

function updateSourceOfferRow(rowIndex, updates) {
  const sheet = getSheetByName(SOURCE_OFFERS_SHEET);
  const headers = getHeaderRow(sheet);
  updateRow(sheet, rowIndex, updates, headers);
}

function appendSourceOfferRow(rowData) {
  const sheet = getSheetByName(SOURCE_OFFERS_SHEET);
  const headers = getHeaderRow(sheet);
  appendRow(sheet, rowData, headers);
}
