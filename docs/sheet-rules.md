# eBay リサーチ支援ツール シート仕様書

## Research シート

### 目的
eBayの売れ筋候補を記録し、利益判定まで行う中枢シート。

### 構造
1行目: ヘッダー行（列名）
2行目以降: データ行（各商品1行）

### カラム定義（24列）

1. RESEARCH_ID - リサーチID（各行を一意に識別。R-001など）
2. EBAY_ITEM_ID - eBay商品ID
3. SKU_CANDIDATE - 仮SKU
4. TITLE_EBAY - eBayタイトル
5. CATEGORY_PATH - カテゴリパス
6. SELLER_ID - セラーID
7. SELLER_LOCATION - セラー所在地
8. SOLD_90D - 90日販売個数
9. ACTIVE_LISTINGS - 同条件の出品数
10. SELL_PRICE_AVG - 想定売価
11. CURRENCY - 通貨
12. FEE_RATE_EBAY - eBay手数料率
13. FEE_RATE_INTL - 海外決済手数料率
14. SHIPPING_INTL_EST - 想定国際送料
15. PACKING_COST - 梱包コスト
16. BEST_SOURCE_MARKET - 最有力仕入れ先
17. BEST_SOURCE_PRICE - 最有力仕入れ総額
18. BEST_SOURCE_NOTE - 仕入れメモ
19. PROFIT_AMOUNT - 粗利額（数式自動計算）
20. PROFIT_MARGIN - 利益率（数式自動計算）
21. PROFIT_OK - 利益OKフラグ（数式自動計算）
22. CANDIDATE_STATUS - 候補ステータス
23. TO_LISTING - 出品台帳へ送るか
24. MEMO - メモ

### 数式実装例

19列目（PROFIT_AMOUNT）:
=IF(BEST_SOURCE_PRICE="", "", SELL_PRICE_AVG - BEST_SOURCE_PRICE - SELL_PRICE_AVG * FEE_RATE_EBAY - SELL_PRICE_AVG * FEE_RATE_INTL - SHIPPING_INTL_EST - PACKING_COST)

20列目（PROFIT_MARGIN）:
=IF(OR(SELL_PRICE_AVG="", PROFIT_AMOUNT=""), "", PROFIT_AMOUNT / SELL_PRICE_AVG)

21列目（PROFIT_OK）:
=IF(OR(PROFIT_MARGIN="", PROFIT_MARGIN < 0.2), "", "OK")

### 入力ルール

手動入力（必須）: RESEARCH_ID、EBAY_ITEM_ID、TITLE_EBAY、SOLD_90D、SELL_PRICE_AVG、CURRENCY、FEE_RATE_EBAY、FEE_RATE_INTL、SHIPPING_INTL_EST、PACKING_COST
手動入力（オプション）: SKU_CANDIDATE、CATEGORY_PATH、SELLER_ID、SELLER_LOCATION、CANDIDATE_STATUS、MEMO
スクリプト更新: BEST_SOURCE_MARKET、BEST_SOURCE_PRICE、BEST_SOURCE_NOTE
数式自動計算: PROFIT_AMOUNT、PROFIT_MARGIN、PROFIT_OK
手動フラグ: TO_LISTING

---

## SourceOffers シート

### 目的
1つの Research 商品に対する複数の仕入れ候補を縦持ちで管理する。

### 構造
1行目: ヘッダー行（列名）
2行目以降: データ行（各仕入れ候補1行）

### カラム定義（10列）

1. SOURCE_ID - 仕入れ候補ID
2. RESEARCH_ID - リサーチID（Research との紐付け）
3. SOURCE_MARKETPLACE - 仕入れ先
4. SOURCE_URL - 仕入れ先URL
5. SOURCE_PRICE - 商品価格
6. DOMESTIC_SHIPPING - 国内送料
7. TOTAL_SOURCE_COST - 仕入れ総額
8. CONDITION_NOTE - 商品状態メモ
9. SOURCE_STATUS - 仕入れ状況
10. MEMO - メモ

### SOURCE_STATUS の値

active - 購入可能な状態（最良候補選定の対象）
sold_out - 売り切れ（除外）
checked - チェック済み（除外）
error - エラー（除外）

---

## Listing シート

### 目的
実際に出品対象とする商品を管理する出品台帳。

### 構造
1行目: ヘッダー行（列名）
2行目以降: データ行（各出品商品1行）

### カラム定義（24列）

1. SKU - 出品用SKU
2. RESEARCH_ID - 元の Research ID
3. TITLE_EN - 英語タイトル
4. PRICE - 出品価格
5. CURRENCY - 通貨
6. QUANTITY - 数量
7. CATEGORY_ID - eBayカテゴリID
8. CONDITION - コンディション
9. DESCRIPTION_EN - 英語説明文
10. ASPECTS_JSON - item specifics
11. IMAGE_LOCAL_1 - ローカル画像1
12. IMAGE_LOCAL_2 - ローカル画像2
13. IMAGE_EPS_1 - EPS画像URL1
14. IMAGE_EPS_2 - EPS画像URL2
15. IMAGE_STATUS - 画像ステータス
16. PAYMENT_POLICY_ID - 支払いポリシーID
17. RETURN_POLICY_ID - 返品ポリシーID
18. FULFILLMENT_POLICY_ID - 配送ポリシーID
19. MERCHANT_LOCATION - 発送ロケーションキー
20. APPROVED - 承認フラグ
21. STATUS - ステータス
22. EBAY_ITEM_ID - eBay商品ID
23. MEMO - メモ

### 入力ルール

スクリプト自動設定: SKU、RESEARCH_ID
手動入力（必須）: TITLE_EN、PRICE、CURRENCY、QUANTITY、CATEGORY_ID、CONDITION、DESCRIPTION_EN
手動入力（オプション）: ASPECTS_JSON、画像情報、ポリシーID、MEMO
手動フラグ: APPROVED、STATUS
API自動更新: EBAY_ITEM_ID

---

## 転送条件（Research → Listing）

以下の条件をすべて満たす Research 行のみが Listing に転送される：

1. PROFIT_OK = OK（利益率20%以上）
2. TO_LISTING = TRUE / YES / OK のいずれか
3. 同じ RESEARCH_ID が既に Listing に存在しない（重複防止）

---

## 重複防止ルール

Listing への転送前に、同じ RESEARCH_ID の行が既に存在するか確認
存在する場合、既存行を削除してから新規行として追加（UPDATE的な動き）
「Listing へ転送」メニューを複数回実行しても重複は発生しない（冪等性確保）

---

## ステータスの遷移例

draft（下書き）
  ↓ タイトル・説明文・カテゴリ等を手動設定
ready（出品準備完了）
  ↓ APPROVED = OK を立てる
listed（出品済み・API送信済み）※将来機能
  ↓ eBay API が EBAY_ITEM_ID を記録

---

## RESEARCH_ID の役割

Research: 各候補行の一意識別子
SourceOffers: Research との紐付けキー
Listing: 出品元の Research を追跡可能に

ルール：
- RESEARCH_ID は Research 内で一意
- SourceOffers の RESEARCH_ID は Research の RESEARCH_ID と必ず対応
- Listing の RESEARCH_ID は Research の RESEARCH_ID と必ず対応

---

## データ更新の順序

1. Research へ基本情報を入力
2. SourceOffers へ仕入れ候補を入力
3. 「SourceOffers から反映」メニューを実行
4. Research の BEST_SOURCE_PRICE が更新、PROFIT_OK が自動計算
5. 「Listing へ転送」メニューを実行
6. Listing に新規行が追加
7. Listing で最終設定を行い APPROVED を立てる

---

## 削除・更新時の注意

Research の行を削除しても、既に Listing にコピーされた行は残る（独立した台帳）
Listing の行を削除しても、Research は影響を受けない
Research で TO_LISTING を削除しても、既に Listing に存在する行は残る

---

## 列名の英語定義

Research シート全列名:
RESEARCH_ID, EBAY_ITEM_ID, SKU_CANDIDATE, TITLE_EBAY, CATEGORY_PATH, SELLER_ID, SELLER_LOCATION, SOLD_90D, ACTIVE_LISTINGS, SELL_PRICE_AVG, CURRENCY, FEE_RATE_EBAY, FEE_RATE_INTL, SHIPPING_INTL_EST, PACKING_COST, BEST_SOURCE_MARKET, BEST_SOURCE_PRICE, BEST_SOURCE_NOTE, PROFIT_AMOUNT, PROFIT_MARGIN, PROFIT_OK, CANDIDATE_STATUS, TO_LISTING, MEMO

SourceOffers シート全列名:
SOURCE_ID, RESEARCH_ID, SOURCE_MARKETPLACE, SOURCE_URL, SOURCE_PRICE, DOMESTIC_SHIPPING, TOTAL_SOURCE_COST, CONDITION_NOTE, SOURCE_STATUS, MEMO

Listing シート全列名:
SKU, RESEARCH_ID, TITLE_EN, PRICE, CURRENCY, QUANTITY, CATEGORY_ID, CONDITION, DESCRIPTION_EN, ASPECTS_JSON, IMAGE_LOCAL_1, IMAGE_LOCAL_2, IMAGE_EPS_1, IMAGE_EPS_2, IMAGE_STATUS, PAYMENT_POLICY_ID, RETURN_POLICY_ID, FULFILLMENT_POLICY_ID, MERCHANT_LOCATION, APPROVED, STATUS, EBAY_ITEM_ID, MEMO

---

## FAQ

Q: BEST_SOURCE_PRICE が空の場合、PROFIT_AMOUNT はどうなる？
A: 数式で IF(BEST_SOURCE_PRICE="", "", ...) と条件付けるため、空のままです。SourceOffers から反映メニューを実行すると値が入ります。

Q: SourceOffers に複数の候補がある場合、どれが選ばれる？
A: SOURCE_STATUS が有効（active など）で、TOTAL_SOURCE_COST が最小の行が選定されます。

Q: Listing に転送した後、Research で TO_LISTING を削除したらどうなる？
A: Listing の行は残ります。Listing は Research から独立した台帳です。

Q: 同じ商品を複数の仕入れ先で仕入れる場合は？
A: Listing に1行だけ存在します（RESEARCH_ID ごとに1行）。複数候補を管理したい場合は、別の RESEARCH_ID として新規登録してください。

Version: v1.0
Last Updated: 2026-04-21
