# eBay リサーチ支援ツール v1 実装方針

## 実装概要

Google Sheets を中心とした「リサーチ支援の初期版」を実装します。
Google Apps Script で複雑なロジック（行マッチング、条件判定、データコピー）を担当し、
スプレッドシート数式で利益計算を行います。

## データフロー（詳細版）

### Phase 1: データ入力
ユーザーが Research シートに基本情報を入力
 - RESEARCH_ID、EBAY_ITEM_ID、TITLE_EBAY、SELLER_ID
 - SOLD_90D、SELL_PRICE_AVG、CURRENCY
 - FEE_RATE_EBAY、FEE_RATE_INTL
 - SHIPPING_INTL_EST、PACKING_COST

ユーザーが SourceOffers シートに仕入れ候補を入力（複数行）
 - RESEARCH_ID、SOURCE_MARKETPLACE、SOURCE_PRICE、DOMESTIC_SHIPPING
 - TOTAL_SOURCE_COST、SOURCE_STATUS

### Phase 2: SourceOffers から Research への反映
スクリプト実行: updateResearchFromSourceOffers()
  各 RESEARCH_ID に対して:
  1. 対応する SourceOffers 行をすべて取得
  2. SOURCE_STATUS = active など有効な行だけフィルタ
  3. TOTAL_SOURCE_COST が最小の行を選定
  4. Research の BEST_SOURCE_MARKET、BEST_SOURCE_PRICE、BEST_SOURCE_NOTE を更新

### Phase 3: 利益計算（スプレッドシート数式）
Research シート内で自動計算:
  PROFIT_AMOUNT = SELL_PRICE_AVG - BEST_SOURCE_PRICE - SELL_PRICE_AVG * FEE_RATE_EBAY - SELL_PRICE_AVG * FEE_RATE_INTL - SHIPPING_INTL_EST - PACKING_COST
  PROFIT_MARGIN = IF(SELL_PRICE_AVG=0, 0, PROFIT_AMOUNT / SELL_PRICE_AVG)
  PROFIT_OK = IF(PROFIT_MARGIN >= 0.2, OK, )

### Phase 4: 出品候補の確認と選定
ユーザーが Research で PROFIT_OK = OK の行を確認
出品したい行に対して、TO_LISTING = TRUE を手動入力

### Phase 5: Listing への転送
スクリプト実行: syncResearchToListing()
  Research 内で以下の条件を満たす行を検出:
  1. PROFIT_OK = OK
  2. TO_LISTING = TRUE / YES / OK のいずれか
  
  各対象行について:
  1. 同じ RESEARCH_ID が既に Listing に存在するか確認
  2. 存在する場合、既存行を削除
  3. Research の行を Listing の新規行としてコピー

### Phase 6: 出品準備（手動）
ユーザーが Listing の各行で以下を手動設定:
  - TITLE_EN（英語タイトル）
  - DESCRIPTION_EN（英語説明文）
  - CATEGORY_ID（eBayカテゴリID）
  - CONDITION（コンディション）
  - PAYMENT_POLICY_ID、RETURN_POLICY_ID、FULFILLMENT_POLICY_ID
  
APPROVED = OK を立てる

## 実装順序

Step 1: config.gs - シート名、列名、デフォルト値の定義
Step 2: utils.gs - 共通ヘルパー関数の実装
Step 3: source-offers.gs - SourceOffers 行読取・フィルタ関数
Step 4: research.gs - Research 行読取・更新関数
Step 5: listing.gs - Listing 行追加・削除・重複チェック関数
Step 6: menu.gs - カスタムメニューの作成

## スプレッドシート数式 vs スクリプトの役割分担

### スプレッドシート数式で処理
粗利額 PROFIT_AMOUNT: =SELL_PRICE_AVG - BEST_SOURCE_PRICE - ...
利益率 PROFIT_MARGIN: =PROFIT_AMOUNT / SELL_PRICE_AVG
利益OK判定 PROFIT_OK: =IF(PROFIT_MARGIN>=0.2, OK, )

### スクリプトで処理
RESEARCH_ID ごとの行マッチング: getSourceOffersByResearchId()
最良仕入れ候補の選定: findBestSourceOffer()
SourceOffers → Research の反映: updateResearchFromSourceOffers()
Research → Listing へのコピー: syncResearchToListing()
メニューUI: onOpen()、menuXxx()

## 冪等性の確保策

### updateResearchFromSourceOffers()
複数回実行してもOK
毎回、最新の SourceOffers データから最良候補を再選定し上書き
以前の BEST_SOURCE_PRICE が無視されても問題ない

### syncResearchToListing()
複数回実行してもOK（重複なし）
対象行（PROFIT_OK=OK & TO_LISTING=TRUE）ごとに:
  1. 既に Listing に同じ RESEARCH_ID が存在するか確認
  2. 存在すれば削除
  3. 新規行として挿入
結果：最新の Research 情報が常に Listing に反映される

## エラーハンドリング方針

データ検証関数：validateResearchRow(row)
  SELL_PRICE_AVG、FEE_RATE_EBAY が空でないか確認
  BEST_SOURCE_PRICE が数値か確認
  異常があれば例外を投げるか、警告ダイアログを表示

ログ出力：Logger.log()
  [INFO] Processing RESEARCH_ID: ABC123
  [ERROR] Invalid data at row 5

## 今後の拡張予定

### v2: eBay API 統合
APPROVED = OK の行を自動的に eBay API に送信
出品完了時、EBAY_ITEM_ID を自動記録

### v3: 仕入れ先 API 統合
メルカリ、ヤフオク等の公式API/スクレイピング対応
SourceOffers の手動入力を削減

### v4: AI による説明文生成
eBayタイトルから英語説明文を自動生成

### v5: 売上・在庫管理
eBay での売上データを定期取得
在庫数の自動管理

Version: v1.0 Implementation Plan
Last Updated: 2026-04-21
