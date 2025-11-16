# 災害時トリアージ管理システム v2.0

## 新機能
- ✅ 自動更新機能（30秒ごと）
- ✅ 患者情報の編集・削除機能
- ✅ 通知システム
- ✅ エリアフィルター
- ✅ 検索・ソート機能
- ✅ CSV出力
- ✅ レスポンシブデザイン

## インストール
```bash
npm install
```

## 開発サーバーの起動
```bash
npm start
```

ブラウザで http://localhost:3000 を開きます

## ビルド
```bash
npm build
```

## 使い方

### 傷病者入力モード
- 患者情報の登録・更新
- トリアージ番号と患者IDは必須（8桁）

### 本部管理モード
- 全患者の一覧表示
- 検索・ソート・フィルター
- 編集・削除機能
- CSV出力
- 全データ削除

## 技術スタック
- React 18
- Tailwind CSS
- Lucide React Icons
- PWA対応
```

### 3️⃣ **フォルダ構成の完成形**
```
triage-management-system/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── App.js          ← アーティファクトのコードをここに保存
│   ├── index.js
│   └── index.css
├── package.json
├── README.md
└── .gitignore