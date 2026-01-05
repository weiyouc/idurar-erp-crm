# Excel Format Specifications

**Source File:** `doc/customer-requirements/各报表清单格式 2025.12.23.xlsx`
**Total Sheets:** 5

---

## 1. 供应商清单

**Total Columns:** 28  
**Sample Data Rows:** 3

### Column Specifications

| # | Column Letter | Header Name | Data Type | Sample Values |
|---|---------------|-------------|-----------|---------------|
| 1 | A | Column_1 | text | NO#, 例如： |
| 2 | B | Column_2 | text | 供應商帳戶, 13 |
| 3 | C | Column_3 | text | 供应商全稱, AMPLE KING INDUSTRIALF LTD.佳皇實業 |
| 4 | D | Column_4 | text | 搜索名稱, A032 |
| 5 | E | Column_5 | text | 簡稱, 佳皇 |
| 6 | F | Column_6 | text | 貨幣, USD |
| 7 | G | Column_7 | text | 組, P04 |
| 8 | H | Column_8 | text | 供應物項組, 塑膠原料 |
| 9 | I | Column_9 | text | 供應商類別, 主料 |
| 10 | J | Column_10 | text | 地址, 九龍長沙灣永康街37-39號福源廣場10樓E室（荔枝角地鐵站） |
| 11 | K | Column_11 | text | 联系人 |
| 12 | L | Column_12 | text | 邮箱 |
| 13 | M | Column_13 | text | 電話, +852 23809090 |
| 14 | N | Column_14 | text | 分機號 |
| 15 | O | Column_15 | text | 手機 |
| 16 | P | Column_16 | text | 傳真號碼 |
| 17 | Q | Column_17 | text | WWW 网站 |
| 18 | R | Column_18 | text | 付款方法 |
| 19 | S | Column_19 | text | 交货条件 |
| 20 | T | Column_20 | text | 最後修改人, S1692 |
| 21 | U | Column_21 | text | 最後修改時間, 2015-12-23 00:00:00 |
| 22 | V | Column_22 | text | Created Date, 2004-10-29 00:00:00 |
| 23 | W | Column_23 | text | Created By, Admin |
| 24 | X | Column_24 | text | 語言, en-au |
| 25 | Y | Column_25 | text | 一次性供貨商, 否 |
| 26 | Z | Column_26 | text | 稅組, 0.13 |
| 27 | AA | Column_27 | text | 價格內含稅, 是 |
| 28 | AB | Column_28 | text | 供应商类型, B |

### Sample Data

```json
[
  {
    "Column_1": "NO#",
    "Column_2": "供應商帳戶",
    "Column_3": "供应商全稱",
    "Column_4": "搜索名稱",
    "Column_5": "簡稱",
    "Column_6": "貨幣",
    "Column_7": "組",
    "Column_8": "供應物項組",
    "Column_9": "供應商類別",
    "Column_10": "地址",
    "Column_11": "联系人",
    "Column_12": "邮箱",
    "Column_13": "電話",
    "Column_14": "分機號",
    "Column_15": "手機",
    "Column_16": "傳真號碼",
    "Column_17": "WWW 网站",
    "Column_18": "付款方法",
    "Column_19": "交货条件",
    "Column_20": "最後修改人",
    "Column_21": "最後修改時間",
    "Column_22": "Created Date",
    "Column_23": "Created By",
    "Column_24": "語言",
    "Column_25": "一次性供貨商",
    "Column_26": "稅組",
    "Column_27": "價格內含稅",
    "Column_28": "供应商类型"
  },
  {
    "Column_1": "例如：",
    "Column_2": "",
    "Column_3": "",
    "Column_4": "",
    "Column_5": "",
    "Column_6": "",
    "Column_7": "",
    "Column_8": "",
    "Column_9": "",
    "Column_10": "",
    "Column_11": "",
    "Column_12": "",
    "Column_13": "",
    "Column_14": "",
    "Column_15": "",
    "Column_16": "",
    "Column_17": "",
    "Column_18": "",
    "Column_19": "",
    "Column_20": "",
    "Column_21": "",
    "Column_22": "",
    "Column_23": "",
    "Column_24": "",
    "Column_25": "",
    "Column_26": "",
    "Column_27": "",
    "Column_28": ""
  }
]
```

---

## 2. 物料清单

**Total Columns:** 17  
**Sample Data Rows:** 3

### Column Specifications

| # | Column Letter | Header Name | Data Type | Sample Values |
|---|---------------|-------------|-----------|---------------|
| 1 | A | Column_1 | text | NO# |
| 2 | B | Column_2 | text | 物料編號 |
| 3 | C | Column_3 | text |    物料描述 |
| 4 | D | Column_4 | text | 單位 |
| 5 | E | Column_5 | text | 优选采购单价 |
| 6 | F | Column_6 | text | 优选供应商 |
| 7 | G | Column_7 | text | 优选供应商编号 |
| 8 | H | Column_8 | text | Lead time |
| 9 | I | Column_9 | text | MOQ |
| 10 | J | Column_10 | text | MPQ |
| 11 | K | Column_11 | text | Last cost |
| 12 | L | Column_12 | text | last buy vendor |
| 13 | M | Column_13 | text | Payment term |
| 14 | N | Column_14 | text | 物料类别 |
| 15 | O | Column_15 | text | 当前仓存数量 |
| 16 | P | Column_16 | text | 仓位 |
| 17 | Q | Column_17 | text | 采购员 |

### Sample Data

```json
[
  {
    "Column_1": "NO#",
    "Column_2": "物料編號",
    "Column_3": "   物料描述",
    "Column_4": "單位",
    "Column_5": "优选采购单价",
    "Column_6": "优选供应商",
    "Column_7": "优选供应商编号",
    "Column_8": "Lead time",
    "Column_9": "MOQ",
    "Column_10": "MPQ",
    "Column_11": "Last cost",
    "Column_12": "last buy vendor",
    "Column_13": "Payment term",
    "Column_14": "物料类别",
    "Column_15": "当前仓存数量",
    "Column_16": "仓位",
    "Column_17": "采购员"
  },
  {
    "Column_1": "",
    "Column_2": "",
    "Column_3": "",
    "Column_4": "",
    "Column_5": "",
    "Column_6": "",
    "Column_7": "",
    "Column_8": "",
    "Column_9": "",
    "Column_10": "",
    "Column_11": "",
    "Column_12": "",
    "Column_13": "",
    "Column_14": "",
    "Column_15": "",
    "Column_16": "",
    "Column_17": ""
  }
]
```

---

## 3. MRP清单

**Total Columns:** 21  
**Sample Data Rows:** 3

### Column Specifications

| # | Column Letter | Header Name | Data Type | Sample Values |
|---|---------------|-------------|-----------|---------------|
| 1 | A | Column_1 | text | NO# |
| 2 | B | Column_2 | text | 生产工厂 |
| 3 | C | Column_3 | text | 物料编号 |
| 4 | D | Column_4 | text | 物料名称 |
| 5 | E | Column_5 | text | 物料类型 |
| 6 | F | Column_6 | text | 需求日期 |
| 7 | G | Column_7 | text | 请购数量 |
| 8 | H | Column_8 | text | 单位 |
| 9 | I | Column_9 | text | 建议采购时间 |
| 10 | J | Column_10 | text | 单价(RMB) |
| 11 | K | Column_11 | text | 采购金额RMB |
| 12 | L | Column_12 | text | 当前仓存数量 |
| 13 | M | Column_13 | text | 可分配库存 |
| 14 | N | Column_14 | text | 供应商编号 |
| 15 | O | Column_15 | text | 供应商名称 |
| 16 | P | Column_16 | text | 客户订单号 |
| 17 | Q | Column_17 | text | 客户型号 |
| 18 | R | Column_18 | text | OTS |
| 19 | S | Column_19 | text | 银图内部SO号 |
| 20 | T | Column_20 | text | 银图内部型号 |
| 21 | U | Column_21 | text | 采购员 |

### Sample Data

```json
[
  {
    "Column_1": "NO#",
    "Column_2": "生产工厂",
    "Column_3": "物料编号",
    "Column_4": "物料名称",
    "Column_5": "物料类型",
    "Column_6": "需求日期",
    "Column_7": "请购数量",
    "Column_8": "单位",
    "Column_9": "建议采购时间",
    "Column_10": "单价(RMB)",
    "Column_11": "采购金额RMB",
    "Column_12": "当前仓存数量",
    "Column_13": "可分配库存",
    "Column_14": "供应商编号",
    "Column_15": "供应商名称",
    "Column_16": "客户订单号",
    "Column_17": "客户型号",
    "Column_18": "OTS",
    "Column_19": "银图内部SO号",
    "Column_20": "银图内部型号",
    "Column_21": "采购员"
  },
  {
    "Column_1": "",
    "Column_2": "",
    "Column_3": "",
    "Column_4": "",
    "Column_5": "",
    "Column_6": "",
    "Column_7": "",
    "Column_8": "",
    "Column_9": "",
    "Column_10": "",
    "Column_11": "",
    "Column_12": "",
    "Column_13": "",
    "Column_14": "",
    "Column_15": "",
    "Column_16": "",
    "Column_17": "",
    "Column_18": "",
    "Column_19": "",
    "Column_20": "",
    "Column_21": ""
  }
]
```

---

## 4. 订单PO清单

**Total Columns:** 25  
**Sample Data Rows:** 3

### Column Specifications

| # | Column Letter | Header Name | Data Type | Sample Values |
|---|---------------|-------------|-----------|---------------|
| 1 | A | Column_1 | text | NO#, 例如 |
| 2 | B | Column_2 | text | 公司, dat |
| 3 | C | Column_3 | text | 采購單號, 24000004 |
| 4 | D | Column_4 | text | 供方號, 178 |
| 5 | E | Column_5 | text | 供方簡稱, 豐高 |
| 6 | F | Column_6 | text | 供应商全称 |
| 7 | G | Column_7 | text | 物料編號, 302-25830003R |
| 8 | H | Column_8 | text | 物料名稱, 彩盒(中掛雙插)SP2583/HC244NGB-320B-SR4  120x72x... |
| 9 | I | Column_9 | text | 采購數量, 5865 |
| 10 | J | Column_10 | text | 采購單位, PCS |
| 11 | K | Column_11 | text | 采購單價, 2.25 |
| 12 | L | Column_12 | text | 幣種, HKD |
| 13 | M | Column_13 | text | 采购金额 |
| 14 | N | Column_14 | text | 已收货数量 |
| 15 | O | Column_15 | text | 未收货数量 |
| 16 | P | Column_16 | text | 建單日期, 2024-02-02 00:00:00 |
| 17 | Q | Column_17 | text | 要求送货日期 |
| 18 | R | Column_18 | text | 实际收货日期 |
| 19 | S | Column_19 | text | 采购员, puysy |
| 20 | T | Column_20 | text | Payment term |
| 21 | U | Column_21 | text | 客户订单号 |
| 22 | V | Column_22 | text | 客户型号 |
| 23 | W | Column_23 | text | 银图内部SO号 |
| 24 | X | Column_24 | text | 银图内部型号 |
| 25 | Y | Column_25 | text | PO remark |

### Sample Data

```json
[
  {
    "Column_1": "NO#",
    "Column_2": "公司",
    "Column_3": "采購單號",
    "Column_4": "供方號",
    "Column_5": "供方簡稱",
    "Column_6": "供应商全称",
    "Column_7": "物料編號",
    "Column_8": "物料名稱",
    "Column_9": "采購數量",
    "Column_10": "采購單位",
    "Column_11": "采購單價",
    "Column_12": "幣種",
    "Column_13": "采购金额",
    "Column_14": "已收货数量",
    "Column_15": "未收货数量",
    "Column_16": "建單日期",
    "Column_17": "要求送货日期",
    "Column_18": "实际收货日期",
    "Column_19": "采购员",
    "Column_20": "Payment term",
    "Column_21": "客户订单号",
    "Column_22": "客户型号",
    "Column_23": "银图内部SO号",
    "Column_24": "银图内部型号",
    "Column_25": "PO remark"
  },
  {
    "Column_1": "例如",
    "Column_2": "",
    "Column_3": "",
    "Column_4": "",
    "Column_5": "",
    "Column_6": "",
    "Column_7": "",
    "Column_8": "",
    "Column_9": "",
    "Column_10": "",
    "Column_11": "",
    "Column_12": "",
    "Column_13": "",
    "Column_14": "",
    "Column_15": "",
    "Column_16": "",
    "Column_17": "",
    "Column_18": "",
    "Column_19": "",
    "Column_20": "",
    "Column_21": "",
    "Column_22": "",
    "Column_23": "",
    "Column_24": "",
    "Column_25": ""
  }
]
```

---

## 5. 仓存清单  Inventory list

**Total Columns:** 10  
**Sample Data Rows:** 3

### Column Specifications

| # | Column Letter | Header Name | Data Type | Sample Values |
|---|---------------|-------------|-----------|---------------|
| 1 | A | Column_1 | text | 项次, 例如 |
| 2 | B | Column_2 | text | 物項編號, 408-00000021C |
| 3 | C | Column_3 | text | 物項名稱, TOA-95PCB板組件(美國版）含1.NTC(樂拓） |
| 4 | D | Column_4 | text | 倉位, ME7 |
| 5 | E | Column_5 | text | 單位, PCS |
| 6 | F | Column_6 | text | 實際庫存, 9738 |
| 7 | G | Column_7 | text | 最後交易日, 2025-07-30 00:00:00 |
| 8 | H | Column_8 | text | 呆滯年數, 0.3 |
| 9 | I | Column_9 | text | 供应商编号 |
| 10 | J | Column_10 | text | 供应商名称 |

### Sample Data

```json
[
  {
    "Column_1": "项次",
    "Column_2": "物項編號",
    "Column_3": "物項名稱",
    "Column_4": "倉位",
    "Column_5": "單位",
    "Column_6": "實際庫存",
    "Column_7": "最後交易日",
    "Column_8": "呆滯年數",
    "Column_9": "供应商编号",
    "Column_10": "供应商名称"
  },
  {
    "Column_1": "例如",
    "Column_2": "",
    "Column_3": "",
    "Column_4": "",
    "Column_5": "",
    "Column_6": "",
    "Column_7": "",
    "Column_8": "",
    "Column_9": "",
    "Column_10": ""
  }
]
```

---
