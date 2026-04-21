# eBay輸出 リサーチ支援ツール 基本設計（スプレッドシート定義込み）

## 0. プロジェクト情報
- プロジェクト名: `ebay-research-pipeline`
- GitHubリポジトリ: `https://github.com/nario0715masa0619-create/ebay-research-pipeline`
- ローカル作業ディレクトリ: `D:\AI_スクリプト成果物\ebay-research-pipeline`
- 基本設計書ファイル名: `docs/ebay-research-pipeline-design.md`

## 1. 目的
- eBay向けの商品リサーチ支援ツールを作る。
- eBay内で日本人セラーが実際に売っている商品を起点に、仕入れ候補を調査し、利益率20%以上の商品だけを出品候補として管理する。
- 将来的には出品台帳まで接続し、自動出品に拡張できる構造にする。

## 2. リサーチ方針
- eBay Product Researchを使い、Seller locations を Japan に絞って日本人セラーの販売実績を確認する。
- 調査期間は過去90日を基本とする。
- 過去90日で2個以上売れた商品を候補とする。
- 候補商品について、メルカリ、ヤフオクなどの仕入れ先価格を調べる。
- 利益計算を行い、利益率20%以上のものだけを出品候補とする。

## 3. 対象市場
- 販売先: eBay。
- 仕入れ先候補: メルカリ、ヤフオク、必要に応じてその他モール。
- 仕入れ先側は公式APIが弱い、または存在しない場合があるため、当面は手動入力または半自動補助を前提とする。

## 4. 利益判定ルール
- 利益率20%以上を絶対条件とする。
- 利益率の計算式は以下とする。

  利益額 = 売価 - 仕入原価 - eBay手数料 - 海外決済手数料 - 国際送料 - 国内送料 - 梱包費 - その他経費

  利益率 = 利益額 / 売価

- 日本住所のセラーには、居住国以外への販売時に海外決済手数料がかかるため、初期設計に含める。
- eBay手数料やその他費用はカテゴリや時期により変動しうるため、シート上では変数として分離して管理する。

## 5. システム全体構造
- 親台帳は Google Sheets とする。
- シート構成は以下の3つを基本とする。
  - Research: リサーチ結果と利益判定。
  - SourceOffers: 仕入れ候補の一覧。
  - Listing: 出品候補・出品台帳。

## 6. リポジトリ構成
- このプロジェクトでは、GitHubリポジトリを正本として管理する。
- ローカル作業ディレクトリは GitHub リポジトリと同期する前提で運用する。
- 想定ディレクトリ構成は以下の通り。

```text
ebay-research-pipeline/
├─ README.md
├─ docs/
│  ├─ ebay-research-pipeline-design.md
│  ├─ implementation-plan.md
│  └─ sheet-rules.md
├─ prompts/
│  ├─ genspark-step1-step2.txt
│  └─ genspark-step3.txt
└─ src/
   ├─ config.gs
   ├─ utils.gs
   ├─ research.gs
   ├─ source-offers.gs
   ├─ listing.gs
   └─ menu.gs
```

### 6.1 各ディレクトリの役割
- `README.md`
  - リポジトリの概要、目的、使い方、構成案内を書く。
- `docs/`
  - 設計書、実装計画、シート仕様などのドキュメントを置く。
- `prompts/`
  - Genspark などのAIコーディングエージェントに渡す指示文を保存する。
- `src/`
  - Google Apps Script の実装ファイルを置く。

---

## 7. Researchシート定義

### 7.1 目的
- eBayの売れ筋候補を記録し、利益判定まで行う中枢シート。

### 7.2 カラム定義（1行目: 日本語、2行目: 英語カラム名）

```csv
リサーチID,eBay商品ID,仮SKU,eBayタイトル,カテゴリパス,セラーID,セラー所在地,90日販売個数,同条件の出品数,想定売価,通貨,eBay手数料率,海外決済手数料率,想定国際送料,梱包コスト,最有力仕入れ先,最有力仕入れ総額,仕入れメモ,粗利額,利益率,利益OKフラグ,候補ステータス,出品台帳へ送るか,メモ
RESEARCH_ID,EBAY_ITEM_ID,SKU_CANDIDATE,TITLE_EBAY,CATEGORY_PATH,SELLER_ID,SELLER_LOCATION,SOLD_90D,ACTIVE_LISTINGS,SELL_PRICE_AVG,CURRENCY,FEE_RATE_EBAY,FEE_RATE_INTL,SHIPPING_INTL_EST,PACKING_COST,BEST_SOURCE_MARKET,BEST_SOURCE_PRICE,BEST_SOURCE_NOTE,PROFIT_AMOUNT,PROFIT_MARGIN,PROFIT_OK,CANDIDATE_STATUS,TO_LISTING,MEMO
```

### 7.3 各カラムの意味
- リサーチID / RESEARCH_ID  
  この行を一意に識別するID。
- eBay商品ID / EBAY_ITEM_ID  
  eBayの商品ID。
- 仮SKU / SKU_CANDIDATE  
  自分側で付ける暫定SKU。
- eBayタイトル / TITLE_EBAY  
  eBay上の商品タイトル。
- カテゴリパス / CATEGORY_PATH  
  eBayのカテゴリ階層。
- セラーID / SELLER_ID  
  商品を出しているセラーのID。
- セラー所在地 / SELLER_LOCATION  
  Seller location。
- 90日販売個数 / SOLD_90D  
  過去90日で売れた個数。
- 同条件の出品数 / ACTIVE_LISTINGS  
  類似条件での出品数。
- 想定売価 / SELL_PRICE_AVG  
  想定販売価格。
- 通貨 / CURRENCY  
  通貨コード。
- eBay手数料率 / FEE_RATE_EBAY  
  eBay手数料率。
- 海外決済手数料率 / FEE_RATE_INTL  
  海外決済手数料率。
- 想定国際送料 / SHIPPING_INTL_EST  
  国際送料見込み。
- 梱包コスト / PACKING_COST  
  梱包資材コスト。
- 最有力仕入れ先 / BEST_SOURCE_MARKET  
  最有力の仕入れ先。
- 最有力仕入れ総額 / BEST_SOURCE_PRICE  
  最有力候補の総仕入れ額。
- 仕入れメモ / BEST_SOURCE_NOTE  
  URLや状態などのメモ。
- 粗利額 / PROFIT_AMOUNT  
  利益額。
- 利益率 / PROFIT_MARGIN  
  利益率。
- 利益OKフラグ / PROFIT_OK  
  20%以上ならOK。
- 候補ステータス / CANDIDATE_STATUS  
  候補の状態。
- 出品台帳へ送るか / TO_LISTING  
  Listingへ送るフラグ。
- メモ / MEMO  
  自由記述欄。

---

## 8. SourceOffersシート定義

### 8.1 目的
- 1つのResearch商品に対する複数の仕入れ候補を縦持ちで管理する。

### 8.2 カラム定義（1行目: 日本語、2行目: 英語カラム名）

```csv
仕入れ候補ID,リサーチID,仕入れ先,仕入れ先URL,商品価格,国内送料,仕入れ総額,商品状態メモ,仕入れ状況,メモ
SOURCE_ID,RESEARCH_ID,SOURCE_MARKETPLACE,SOURCE_URL,SOURCE_PRICE,DOMESTIC_SHIPPING,TOTAL_SOURCE_COST,CONDITION_NOTE,SOURCE_STATUS,MEMO
```

### 8.3 各カラムの意味
- 仕入れ候補ID / SOURCE_ID  
  仕入れ候補行を識別するID。
- リサーチID / RESEARCH_ID  
  Researchシートとの紐付けID。
- 仕入れ先 / SOURCE_MARKETPLACE  
  仕入れ元モール。
- 仕入れ先URL / SOURCE_URL  
  商品URL。
- 商品価格 / SOURCE_PRICE  
  商品価格。
- 国内送料 / DOMESTIC_SHIPPING  
  国内送料。
- 仕入れ総額 / TOTAL_SOURCE_COST  
  仕入れ総額。
- 商品状態メモ / CONDITION_NOTE  
  商品状態メモ。
- 仕入れ状況 / SOURCE_STATUS  
  候補の有効状態。
- メモ / MEMO  
  自由記述欄。

---

## 9. Listingシート定義

### 9.1 目的
- 実際に出品対象とする商品を管理する出品台帳。
- 将来のeBay API出品の入力元とする。

### 9.2 カラム定義（1行目: 日本語、2行目: 英語カラム名）

```csv
SKU,リサーチID,英語タイトル,出品価格,通貨,数量,eBayカテゴリID,コンディション,英語説明文,item specifics,ローカル画像1,ローカル画像2,EPS画像URL1,EPS画像URL2,画像ステータス,支払いポリシーID,返品ポリシーID,配送ポリシーID,発送ロケーションキー,承認フラグ,ステータス,eBay商品ID,メモ
SKU,RESEARCH_ID,TITLE_EN,PRICE,CURRENCY,QUANTITY,CATEGORY_ID,CONDITION,DESCRIPTION_EN,ASPECTS_JSON,IMAGE_LOCAL_1,IMAGE_LOCAL_2,IMAGE_EPS_1,IMAGE_EPS_2,IMAGE_STATUS,PAYMENT_POLICY_ID,RETURN_POLICY_ID,FULFILLMENT_POLICY_ID,MERCHANT_LOCATION,APPROVED,STATUS,EBAY_ITEM_ID,MEMO
```

### 9.3 各カラムの意味
- SKU / SKU  
  出品SKU。
- リサーチID / RESEARCH_ID  
  元のResearch ID。
- 英語タイトル / TITLE_EN  
  出品用タイトル。
- 出品価格 / PRICE  
  出品価格。
- 通貨 / CURRENCY  
  通貨コード。
- 数量 / QUANTITY  
  在庫数。
- eBayカテゴリID / CATEGORY_ID  
  eBayカテゴリID。
- コンディション / CONDITION  
  商品状態。
- 英語説明文 / DESCRIPTION_EN  
  英語説明文。
- item specifics / ASPECTS_JSON  
  商品属性。
- ローカル画像1 / IMAGE_LOCAL_1  
  ローカル画像1。
- ローカル画像2 / IMAGE_LOCAL_2  
  ローカル画像2。
- EPS画像URL1 / IMAGE_EPS_1  
  eBay用画像URL1。
- EPS画像URL2 / IMAGE_EPS_2  
  eBay用画像URL2。
- 画像ステータス / IMAGE_STATUS  
  画像管理状態。
- 支払いポリシーID / PAYMENT_POLICY_ID  
  支払いポリシー。
- 返品ポリシーID / RETURN_POLICY_ID  
  返品ポリシー。
- 配送ポリシーID / FULFILLMENT_POLICY_ID  
  配送ポリシー。
- 発送ロケーションキー / MERCHANT_LOCATION  
  発送ロケーション。
- 承認フラグ / APPROVED  
  承認有無。
- ステータス / STATUS  
  draft / ready / listed など。
- eBay商品ID / EBAY_ITEM_ID  
  出品後の商品ID。
- メモ / MEMO  
  自由記述欄。

---

## 10. データの流れ
1. eBay Product Research で日本人セラーの売れ筋を抽出する。
2. 条件に合う商品を Research シートに入力する。
3. 各商品について、SourceOffers シートに複数の仕入れ候補を登録する。
4. Research シートで最有力仕入れ候補を反映し、利益額・利益率を計算する。
5. 利益率20%以上かつ出品したいものに TO_LISTING を立て、Listing シートへ流す。
6. Listing シートでタイトル・説明文・カテゴリ・ポリシーなどを整え、APPROVED を立てる。
7. 将来的には APPROVED 行を eBay API 出品処理につなげる。

## 11. 自動化範囲（初期）
- Research シートへの候補登録補助。
- SourceOffers から Research への最有力候補反映補助。
- 利益額・利益率計算、20%以上判定。
- Research → Listing への行コピー。
- Listing側のステータス更新。

## 12. 当面は手動の範囲
- eBay画面でのProduct Research操作。
- 仕入れ先候補探し。
- タイトル・説明文の最終修正。
- カテゴリ選定、ポリシー選定。

## 13. Gensparkへの指示前提
- Genspark などのAIコーディングエージェントに指示を出す際は、設計書の位置を以下の相対パスで指定する。

```text
docs/ebay-research-pipeline-design.md
```

- 実装対象は Google Apps Script を基本とする。
- Genspark用の指示文は `prompts/` ディレクトリ配下に保存する。
- 想定ファイル例:
  - `prompts/genspark-step1-step2.txt`
  - `prompts/genspark-step3.txt`

## 14. この設計のゴール
- スクール式リサーチをそのまま再現するのではなく、
  - 日本人セラーの売れ筋抽出
  - 仕入れ候補比較
  - 利益率20%以上の判定
  - 出品候補化
  を一気通貫で回せる土台を作ること。
- この基本設計をもとに、次段階で
  - 実装計画
  - Google Apps Script 実装
  - Genspark向け実装指示
  に分解する。