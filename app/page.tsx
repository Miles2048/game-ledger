"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Platform = "NS1" | "NS2" | "待确认";
type GameRecord = {
  id: string;
  titleZh: string;
  titleEn: string;
  platform: Platform;
  buyPrice: number;
  salePrice: number | null;
  coverUrl: string;
  sourceUrl: string;
  sourceLabel: string;
};

type SortKey = "titleZh" | "platform" | "buyPrice" | "salePrice" | "profit";
type SortOrder = "asc" | "desc";

const STORAGE_KEY = "switch-ledger-records-v1";
const nintendo = "Nintendo 官方商品页";

const images = {
  sports:
    "https://assets.pawnamerica.com/ProductImages/24522010050/a20541e5-8a54-4c80-888e-b4890b5a6437.jpg",
  cyberpunk:
    "https://myshopville.com/cdn/shop/files/cyberpunk-2077-ultimate-edition-nintendo-switch-2-box-cover.jpg?v=1746042752",
  bananza:
    "https://mario.wiki.gallery/images/thumb/2/2d/DK_Bananza_Box_NA.png/1200px-DK_Bananza_Box_NA.png",
  totk:
    "https://gamer4ever.com.co/cdn/shop/products/tearsofthekingdom.png?v=1677188667",
  totk2:
    "https://retromtl.com/cdn/shop/files/Switch2-TearsOfTheKingdomNew.jpg?v=1749046942&width=1500",
  splatoon:
    "https://www.staples-3p.com/s7/is/image/Staples/3A503454-3423-425B-A1E0993125D1D2C1_sc7?hei=512&wid=512",
  mario:
    "https://i.ebayimg.com/images/g/mZgAAOSw9J9lMU6F/s-l1200.png",
  botw:
    "https://www.gaincity.com/media/catalog/product/cache/6c6c50d4c233a553cee4f0d7353c6a74/z/e/zelda_bw_.jpg",
};

const SEED_RECORDS: GameRecord[] = [
  { id: "1", titleZh: "Nintendo Switch 运动", titleEn: "Nintendo Switch Sports", platform: "NS1", buyPrice: 138.86, salePrice: 168.98, coverUrl: images.sports, sourceUrl: "https://www.nintendo.com/us/store/products/nintendo-switch-sports-switch/", sourceLabel: nintendo },
  { id: "2", titleZh: "赛博朋克 2077", titleEn: "Cyberpunk 2077: Ultimate Edition", platform: "NS2", buyPrice: 257.8, salePrice: 263.41, coverUrl: images.cyberpunk, sourceUrl: "https://myshopville.com/products/cyberpunk-2077-ultimate-edition-nintendo-switch-2", sourceLabel: "实体盒装封面" },
  { id: "3", titleZh: "咚奇刚 蕉力全开", titleEn: "Donkey Kong Bananza", platform: "NS2", buyPrice: 249.8, salePrice: 270, coverUrl: images.bananza, sourceUrl: "https://www.nintendo.com/us/store/products/nintendo-switch-2-donkey-kong-bananza-121485/", sourceLabel: nintendo },
  { id: "4", titleZh: "Nintendo Switch 运动", titleEn: "Nintendo Switch Sports", platform: "NS1", buyPrice: 182, salePrice: null, coverUrl: images.sports, sourceUrl: "https://www.nintendo.com/us/store/products/nintendo-switch-sports-switch/", sourceLabel: nintendo },
  { id: "5", titleZh: "塞尔达传说 王国之泪", titleEn: "The Legend of Zelda: Tears of the Kingdom", platform: "NS1", buyPrice: 295, salePrice: null, coverUrl: images.totk, sourceUrl: "https://www.nintendo.com/us/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/", sourceLabel: nintendo },
  { id: "6", titleZh: "斯普拉遁 3", titleEn: "Splatoon 3", platform: "NS1", buyPrice: 169.82, salePrice: 178, coverUrl: images.splatoon, sourceUrl: "https://www.nintendo.com/us/store/products/splatoon-3-switch/", sourceLabel: nintendo },
  { id: "7", titleZh: "Nintendo Switch 运动", titleEn: "Nintendo Switch Sports", platform: "NS1", buyPrice: 170, salePrice: null, coverUrl: images.sports, sourceUrl: "https://www.nintendo.com/us/store/products/nintendo-switch-sports-switch/", sourceLabel: nintendo },
  { id: "8", titleZh: "塞尔达传说 王国之泪（Switch 2）", titleEn: "The Legend of Zelda: Tears of the Kingdom – Nintendo Switch 2 Edition", platform: "NS2", buyPrice: 253.6, salePrice: null, coverUrl: images.totk2, sourceUrl: "https://www.nintendo.com/us/store/products/nintendo-switch-2-the-legend-of-zelda-tears-of-the-kingdom-nintendo-switch-2-edition-121504/", sourceLabel: nintendo },
  { id: "9", titleZh: "超级马力欧兄弟 惊奇", titleEn: "Super Mario Bros. Wonder", platform: "NS1", buyPrice: 223, salePrice: 233, coverUrl: images.mario, sourceUrl: "https://www.nintendo.com/us/store/products/super-mario-bros-wonder-switch/", sourceLabel: nintendo },
  { id: "10", titleZh: "塞尔达传说 旷野之息", titleEn: "The Legend of Zelda: Breath of the Wild", platform: "NS1", buyPrice: 249, salePrice: 280, coverUrl: images.botw, sourceUrl: "https://www.nintendo.com/us/store/products/the-legend-of-zelda-breath-of-the-wild-switch/", sourceLabel: nintendo },
];

const blankRecord = (): GameRecord => ({ id: "", titleZh: "", titleEn: "", platform: "待确认", buyPrice: 0, salePrice: null, coverUrl: "", sourceUrl: "", sourceLabel: nintendo });
const currency = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });
const money = (value: number) => currency.format(value);
const profitOf = (record: GameRecord) => record.salePrice === null ? null : Number((record.salePrice - record.buyPrice).toFixed(2));
const refreshCatalogCover = (record: GameRecord) => {
  const current = SEED_RECORDS.find((item) => item.titleZh === record.titleZh && item.platform === record.platform);
  return current ? { ...record, coverUrl: current.coverUrl, sourceUrl: current.sourceUrl, sourceLabel: current.sourceLabel } : record;
};

function parseCsv(text: string): GameRecord[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV 至少需要标题行和一条记录。");
  const headers = lines[0].split(",").map((item) => item.trim());
  const at = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() ?? "";
  return lines.slice(1).map((line) => {
    const row = line.split(",");
    const sale = Number(at(row, "卖出价") || at(row, "salePrice"));
    return {
      id: crypto.randomUUID(),
      titleZh: at(row, "游戏") || at(row, "titleZh"),
      titleEn: at(row, "英文名") || at(row, "titleEn"),
      platform: (["NS1", "NS2", "待确认"].includes(at(row, "版本") || at(row, "platform")) ? (at(row, "版本") || at(row, "platform")) : "待确认") as Platform,
      buyPrice: Number(at(row, "买入价") || at(row, "buyPrice")) || 0,
      salePrice: Number.isFinite(sale) && (at(row, "卖出价") || at(row, "salePrice")) !== "" ? sale : null,
      coverUrl: at(row, "封面链接") || at(row, "coverUrl"),
      sourceUrl: at(row, "来源链接") || at(row, "sourceUrl"),
      sourceLabel: at(row, "封面来源") || at(row, "sourceLabel") || nintendo,
    };
  }).filter((record) => record.titleZh || record.titleEn);
}

export default function Home() {
  const [records, setRecords] = useState<GameRecord[]>(SEED_RECORDS);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"全部" | Platform>("全部");
  const [saleFilter, setSaleFilter] = useState<"全部" | "已售出" | "持有中">("全部");
  const [sort, setSort] = useState<{ key: SortKey; order: SortOrder }>({ key: "titleZh", order: "asc" });
  const [editing, setEditing] = useState<GameRecord | null>(null);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setRecords((JSON.parse(saved) as GameRecord[]).map(refreshCatalogCover)); } catch { window.localStorage.removeItem(STORAGE_KEY); }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, ready]);

  const stats = useMemo(() => {
    const sold = records.filter((record) => record.salePrice !== null);
    return {
      count: records.length,
      holding: records.length - sold.length,
      buy: records.reduce((total, record) => total + record.buyPrice, 0),
      sale: sold.reduce((total, record) => total + (record.salePrice ?? 0), 0),
      profit: sold.reduce((total, record) => total + (profitOf(record) ?? 0), 0),
      unresolved: records.filter((record) => record.platform === "待确认").length,
    };
  }, [records]);

  const shown = useMemo(() => records.filter((record) => {
    const text = `${record.titleZh} ${record.titleEn}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) &&
      (platformFilter === "全部" || record.platform === platformFilter) &&
      (saleFilter === "全部" || (saleFilter === "已售出" ? record.salePrice !== null : record.salePrice === null));
  }).sort((a, b) => {
    const aProfit = profitOf(a);
    const bProfit = profitOf(b);
    if (sort.key === "profit" && (aProfit === null || bProfit === null)) {
      if (aProfit === bProfit) return 0;
      return aProfit === null ? 1 : -1;
    }
    const aValue = sort.key === "profit" ? aProfit : a[sort.key];
    const bValue = sort.key === "profit" ? bProfit : b[sort.key];
    const delta = typeof aValue === "string" ? aValue.localeCompare(String(bValue), "zh-CN") : Number(aValue) - Number(bValue);
    return sort.order === "asc" ? delta : -delta;
  }), [records, query, platformFilter, saleFilter, sort]);

  const changeSort = (key: SortKey) => setSort((current) => ({ key, order: current.key === key && current.order === "asc" ? "desc" : "asc" }));
  const saveRecord = (record: GameRecord) => {
    if (!record.titleZh.trim() && !record.titleEn.trim()) return;
    setRecords((items) => items.some((item) => item.id === record.id) ? items.map((item) => item.id === record.id ? record : item) : [{ ...record, id: crypto.randomUUID() }, ...items]);
    setEditing(null);
  };
  const deleteRecord = (id: string) => {
    if (window.confirm("删除这条购买记录？")) setRecords((items) => items.filter((item) => item.id !== id));
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      if (!Array.isArray(imported)) throw new Error("JSON 须为记录数组。");
      setRecords(imported.map((record: Partial<GameRecord>) => ({ ...blankRecord(), ...record, id: crypto.randomUUID() })));
      setImportError("");
    } catch (error) { setImportError(error instanceof Error ? error.message : "导入失败，请检查文件格式。"); }
    event.target.value = "";
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "游戏账本备份.json"; link.click(); URL.revokeObjectURL(url);
  };

  return <main className="page-shell">
    <header className="topbar">
      <div className="brand">游戏账本</div>
      <div className="top-actions"><label className="button quiet">导入 <input aria-label="导入 JSON 或 CSV" type="file" accept=".json,.csv" onChange={importFile} /></label><button className="button quiet" onClick={exportData}>导出备份</button><button className="button primary" onClick={() => setEditing(blankRecord())}>＋ 新增记录</button></div>
    </header>

    <section className="stats" aria-label="统计摘要">
      <article><span>游戏</span><strong>{stats.count}</strong></article><article><span>投入</span><strong>{money(stats.buy)}</strong></article><article><span>回笼</span><strong>{money(stats.sale)}</strong></article><article><span>盈亏</span><strong>{stats.profit >= 0 ? "+" : ""}{money(stats.profit)}</strong></article>
    </section>

    <section className="ledger">
      <div className="ledger-head"><h1>记录</h1><span>{shown.length} / {records.length}</span></div>
      <div className="filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索中文或英文游戏名" aria-label="搜索游戏" /><div className="filter-group"><select aria-label="筛选版本" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value as "全部" | Platform)}><option>全部</option><option>NS1</option><option>NS2</option><option>待确认</option></select><select aria-label="筛选出售状态" value={saleFilter} onChange={(event) => setSaleFilter(event.target.value as "全部" | "已售出" | "持有中")}><option>全部</option><option>已售出</option><option>持有中</option></select></div></div>
      {importError && <p className="import-error">导入失败：{importError}</p>}
      <div className="table-wrap"><table><thead><tr><th>游戏</th><Sortable label="版本" column="platform" sort={sort} onSort={changeSort} /><Sortable label="买入" column="buyPrice" sort={sort} onSort={changeSort} /><Sortable label="卖出" column="salePrice" sort={sort} onSort={changeSort} /><Sortable label="盈亏" column="profit" sort={sort} onSort={changeSort} /><th>状态</th><th aria-label="操作" /></tr></thead><tbody>{shown.map((record) => { const profit = profitOf(record); return <tr key={record.id}><td><div className="game-cell">{record.coverUrl ? <img src={record.coverUrl} alt={`${record.titleZh} 实体卡带封面`} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="cover-fallback">{record.titleZh.slice(0, 2)}</div>}<div><strong>{record.titleZh}</strong><small>{record.titleEn || "未填写英文名"}</small></div></div></td><td><span className={`platform ${record.platform === "待确认" ? "pending" : ""}`}>{record.platform}</span></td><td>{money(record.buyPrice)}</td><td>{record.salePrice === null ? "—" : money(record.salePrice)}</td><td className={profit === null ? "muted" : profit >= 0 ? "positive" : "negative"}>{profit === null ? "—" : `${profit >= 0 ? "+" : ""}${money(profit)}`}</td><td><span className="status">{record.salePrice === null ? "持有中" : "已售出"}</span></td><td><div className="row-actions"><button onClick={() => setEditing(record)}>编辑</button><button className="danger" onClick={() => deleteRecord(record.id)}>删除</button></div></td></tr>; })}</tbody></table></div>
      {!shown.length && <div className="empty"><strong>没有匹配的记录</strong><span>试试清除筛选条件，或新增一条游戏记录。</span></div>}
    </section>
    {editing && <RecordDialog record={editing} onClose={() => setEditing(null)} onSave={saveRecord} />}
  </main>;
}

function Sortable({ label, column, sort, onSort }: { label: string; column: SortKey; sort: { key: SortKey; order: SortOrder }; onSort: (column: SortKey) => void }) {
  return <th><button className="sort" onClick={() => onSort(column)}>{label} {sort.key === column ? (sort.order === "asc" ? "↑" : "↓") : "↕"}</button></th>;
}

function RecordDialog({ record, onClose, onSave }: { record: GameRecord; onClose: () => void; onSave: (record: GameRecord) => void }) {
  const [form, setForm] = useState(record);
  const update = (key: keyof GameRecord, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(form); };
  return <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={submit}><div className="dialog-title"><h2>{record.id ? "编辑记录" : "新增记录"}</h2><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid"><Field label="中文游戏名" value={form.titleZh} onChange={(value) => update("titleZh", value)} required /><Field label="英文游戏名" value={form.titleEn} onChange={(value) => update("titleEn", value)} /><label>版本<select value={form.platform} onChange={(event) => update("platform", event.target.value as Platform)}><option>NS1</option><option>NS2</option><option>待确认</option></select></label><Field label="买入价（¥）" type="number" value={form.buyPrice} onChange={(value) => update("buyPrice", Number(value))} required /><label>卖出价（¥）<input type="number" min="0" step="0.01" value={form.salePrice ?? ""} onChange={(event) => update("salePrice", event.target.value === "" ? null : Number(event.target.value))} /></label><Field label="封面链接" value={form.coverUrl} onChange={(value) => update("coverUrl", value)} /><Field label="来源链接" value={form.sourceUrl} onChange={(value) => update("sourceUrl", value)} /><Field label="封面来源" value={form.sourceLabel} onChange={(value) => update("sourceLabel", value)} /></div><div className="dialog-actions"><button type="button" className="button quiet" onClick={onClose}>取消</button><button className="button primary" type="submit">保存</button></div></form></div>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label>{label}<input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}
