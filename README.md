# eBay輸出 リサーチ支援ツール

eBayで売れている日本人セラーの商品を起点に、国内の仕入れ候補を調査し、利益率20%以上の商品だけを出品候補として管理するツールです。

## プロジェクト概要

- 目的: eBay向けの商品リサーチ支援
- 対象: 日本人セラーの売れ筋商品
- 期間: 過去90日で2個以上の売上実績がある商品
- 利益判定: 利益率20%以上が絶対条件
- データストア: Google Sheets（3シート構成）
- 自動化: Google Apps Script + スプレッドシート数式

## システムアーキテクチャ

3つのシート：
- Research: eBayの売れ筋候補と利益判定。中枢台帳。
- SourceOffers: 1つのResearch商品に対する複数の仕入れ候補。
- Listing: 出品対象商品の最終管理台帳。eBay API出品の入力元。

## ディレクトリ構成

ebay-research-pipeline/
├─ README.md
├─ docs/
│  ├─ ebay-research-pipeline-design.md
│  ├─ implementation-plan.md
│  └─ sheet-rules.md
└─ src/
   ├─ config.gs
   ├─ utils.gs
   ├─ research.gs
   ├─ source-offers.gs
   ├─ listing.gs
   └─ menu.gs

## 導入方法

### 前提条件
- Google スプレッドシートを所有している
- Google Apps Script の基本的な操作ができる

### ステップ

1. Google スプレッドシートを準備
   - 新規スプレッドシートを作成
   - 3つのシートを作成: Research、SourceOffers、Listing
   - 各シートのヘッダー行（1行目）に列名を入力

2. Google Apps Script をセットアップ
   - スプレッドシートの「拡張機能」→「Apps Script」を開く
   - src/ 配下の6つのファイルの内容をそれぞれ新規ファイルとしてコピーペースト
   - 保存する

3. スプレッドシートをリロード
   - Google スプレッドシートを再度開くと、カスタムメニュー「eBayリサーチ」が表示される

## 実行方法

### 初期データ入力

1. Research シートにデータを入力
   - eBay Product Research で日本人セラーの売れ筋を確認
   - RESEARCH_ID（一意のID）、EBAY_ITEM_ID、TITLE_EBAY、SELL_PRICE_AVG などを入力

2. SourceOffers シートに複数の仕入れ候補を入力
   - 各 RESEARCH_ID に対応する複数の仕入れ候補を登録
   - SOURCE_MARKETPLACE、SOURCE_PRICE、DOMESTIC_SHIPPING などを入力

### 自動化処理

「SourceOffers から反映」メニュー
- 各 RESEARCH_ID に対応する最安の仕入れ候補を Research に反映
- BEST_SOURCE_PRICE、BEST_SOURCE_MARKET、BEST_SOURCE_NOTE を自動更新

「Listing へ転送」メニュー
- PROFIT_OK = OK かつ TO_LISTING = TRUE の Research 行を Listing にコピー
- 重複チェック：同じ RESEARCH_ID が既に Listing に存在する場合は、既存行を置き換える

### 手動設定

1. Research で利益判定
   - PROFIT_AMOUNT、PROFIT_MARGIN、PROFIT_OK が自動計算される
   - 利益率20%以上で PROFIT_OK = OK

2. TO_LISTING フラグを立てる
   - PROFIT_OK = OK の行で、出品したいものに TO_LISTING = TRUE を入力

3. Listing で最終設定
   - 英語タイトル（TITLE_EN）、説明文（DESCRIPTION_EN）、カテゴリ（CATEGORY_ID）、ポリシー等を手動入力
   - APPROVED = OK を立てて出品準備完了

## 重要な業務ルール

### 利益率計算

利益額 = 売価 - 仕入原価 - eBay手数料 - 海外決済手数料 - 国際送料 - 国内送料 - 梱包費 - その他経費
利益率 = 利益額 / 売価

### 利益判定
- 絶対条件: 利益率 20% 以上

### 最良仕入れ候補の選定ルール
1. SOURCE_STATUS が有効な行のみ対象
2. TOTAL_SOURCE_COST が最も低い行を採用
3. 同額なら最初の有効行を採用

### Listing 転送条件
- PROFIT_OK = OK
- TO_LISTING = TRUE / YES / OK のいずれか
- 同じ RESEARCH_ID が既に Listing に存在する場合は、既存行を削除してから再追加

## 技術スタック

- データストア: Google Sheets
- 自動化: Google Apps Script
- 計算: スプレッドシート数式（PROFIT_AMOUNT、PROFIT_MARGIN、PROFIT_OK）
- UI: Google Sheets カスタムメニュー

## 今後の拡張予定

- v2: eBay API との自動出品連携
- v3: 仕入れ先API（メルカリ、ヤフオク等）のスクレイピング/API統合
- v4: AI による商品説明文・タイトルの自動生成
- v5: 売上・在庫管理の統合

## トラブルシューティング

### メニューが表示されない
- Google Apps Script を保存してから、スプレッドシートをリロード
- 承認ダイアログが表示されたら「承認」をクリック

### データが反映されない
- ヘッダー行が1行目に正しく入力されているか確認
- 列名のスペルが正確に一致しているか確認

### 重複行が発生した
- 「Listing へ転送」メニューを再実行すると、重複が解消される（既存行を置き換える）

## サポート

問題が発生した場合は、GitHubのIssuesセクションで報告してください。

Version: v1.0（初期リリース）
Last Updated: 2026-04-21
