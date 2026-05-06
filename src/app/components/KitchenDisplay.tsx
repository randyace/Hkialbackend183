import { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, Clock, CheckCircle2, Utensils, Bell, BellOff,
  RefreshCw, AlertCircle, Users, MapPin, CheckCheck, Eye, LayoutGrid, Languages,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// ── Language ──────────────────────────────────────────────────────────────────
type Lang = 'en' | 'zh';

const T = {
  en: {
    systemTitle:        'Kitchen Display System',
    systemSubtitle:     'HKIA VIP Lounge · Live Order Board',
    refreshedAt:        'Refreshed',
    refreshTitle:       'Refresh',
    muteNotif:          'Mute notifications',
    enableNotif:        'Enable notifications',
    newOrderBanner:     '🔔 New Order Incoming — Please Acknowledge!',
    tabAll:             'All Orders',
    tabNew:             'New Orders',
    tabReceived:        'Order Received',
    tabServed:          'Served',
    emptyAll:           'No orders yet',
    emptyNew:           'No new orders',
    emptyReceived:      'No orders in progress',
    emptyServed:        'No served orders yet',
    rush:               'RUSH',
    allergyBadge:       '⚠ Allergy',
    guests:             (n: number) => `${n} guest${n !== 1 ? 's' : ''}`,
    receivedAgo:        'rcvd',
    itemsAcknowledged:  'Items acknowledged',
    itemsReady:         'Items ready',
    allergyAlertTitle:  'Food Allergy Alert',
    checkAllergy:       '⚠ check allergy',
    btnReceived:        'Received',
    btnReady:           'Ready',
    btnUndo:            'Undo',
    markAllReceived:    'Mark All as Received',
    markAllReady:       'Mark All as Ready',
    allAcknowledgedHint:'All items acknowledged — order moved to In Progress',
    allReadyHint:       'All items ready — order marked as Served',
    servedStamp:        'Served',
    toastOrderReceived: 'Order Received!',
    toastFoodServed:    '🍽 Food Served!',
    toastNewOrder:      '🔔 New Order Received!',
    toastRefreshed:     'Display refreshed',
    legendNew:          'New — tap Received per item to acknowledge',
    legendReceived:     'In Progress — tap Ready per item once prepared',
    legendServed:       'Served — order complete',
    legendAllergy:      'Orange highlight = allergy / special note',
    switchLang:         '中文',
  },
  zh: {
    systemTitle:        '廚房顯示系統',
    systemSubtitle:     '香港國際機場貴賓室 · 實時訂單看板',
    refreshedAt:        '更新於',
    refreshTitle:       '重新整理',
    muteNotif:          '關閉提示音',
    enableNotif:        '開啟提示音',
    newOrderBanner:     '🔔 新訂單到達 — 請立即確認！',
    tabAll:             '全部訂單',
    tabNew:             '新訂單',
    tabReceived:        '備餐中',
    tabServed:          '已上菜',
    emptyAll:           '暫無訂單',
    emptyNew:           '暫無新訂單',
    emptyReceived:      '暫無備餐中訂單',
    emptyServed:        '暫無已上菜記錄',
    rush:               '加急',
    allergyBadge:       '⚠ 過敏',
    guests:             (n: number) => `${n} 位客人`,
    receivedAgo:        '已接',
    itemsAcknowledged:  '已確認項目',
    itemsReady:         '已備妥項目',
    allergyAlertTitle:  '食物過敏警示',
    checkAllergy:       '⚠ 請查過敏',
    btnReceived:        '已接單',
    btnReady:           '已備妥',
    btnUndo:            '撤回',
    markAllReceived:    '全部標為已接單',
    markAllReady:       '全部標為已備妥',
    allAcknowledgedHint:'所有項目已確認 — 訂單移至備餐中',
    allReadyHint:       '所有項目已備妥 — 訂單標記為已上菜',
    servedStamp:        '已上菜',
    toastOrderReceived: '訂單已接單！',
    toastFoodServed:    '🍽 食物已上菜！',
    toastNewOrder:      '🔔 新訂單到達！',
    toastRefreshed:     '已重新整理',
    legendNew:          '新訂單 — 點選「已接單」確認各項目',
    legendReceived:     '備餐中 — 完成後點選「已備妥」',
    legendServed:       '已上菜 — 訂單完成',
    legendAllergy:      '橙色標示 = 過敏 / 特別備註',
    switchLang:         'English',
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus = 'new' | 'received' | 'served';
type ActiveTab   = 'all' | 'new' | 'received' | 'served';

interface KDSOrderItem {
  id: number;
  name: string;
  nameZh: string;
  category: 'Food' | 'Beverage' | 'Dessert' | 'Snack';
  quantity: number;
  notes?: string;
  notesZh?: string;
  allergyFlag?: boolean;
  done: boolean;
}

interface KDSOrder {
  id: string;
  posOrderNo: string;
  suiteName: string;
  suiteNameZh: string;
  guestName: string;
  guestCount: number;
  placedAt: Date;
  status: OrderStatus;
  receivedAt?: Date;
  servedAt?: Date;
  items: KDSOrderItem[];
  priority: 'normal' | 'rush';
  allergyAlert?: string;
  allergyAlertZh?: string;
}

// ── Category labels ───────────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, { en: string; zh: string }> = {
  Food:     { en: 'Food',     zh: '食物' },
  Beverage: { en: 'Beverage', zh: '飲品' },
  Dessert:  { en: 'Dessert',  zh: '甜品' },
  Snack:    { en: 'Snack',    zh: '小食' },
};

const CATEGORY_COLOR: Record<string, string> = {
  Food:     'bg-orange-100 text-orange-700 border border-orange-200',
  Beverage: 'bg-blue-100   text-blue-700   border border-blue-200',
  Dessert:  'bg-pink-100   text-pink-700   border border-pink-200',
  Snack:    'bg-yellow-100 text-yellow-700  border border-yellow-200',
};

// ── Mock seed data ─────────────────────────────────────────────────────────────
const SEED_ORDERS: KDSOrder[] = [
  {
    id: 'KDS-001',
    posOrderNo: 'POS-20260316-000012',
    suiteName: 'VIP Suite A1', suiteNameZh: 'VIP貴賓廳 A1',
    guestName: 'Mr John Smith',
    guestCount: 3,
    placedAt: new Date(Date.now() - 2 * 60 * 1000),
    status: 'new',
    priority: 'rush',
    allergyAlert: 'Shellfish, Peanuts', allergyAlertZh: '介貝類、花生',
    items: [
      { id: 1, name: 'Grilled Salmon Fillet', nameZh: '香煎三文魚柳', category: 'Food',     quantity: 2, notes: 'Medium-well, extra lemon', notesZh: '七成熟，多檸檬', allergyFlag: false, done: false },
      { id: 2, name: 'Caesar Salad',          nameZh: '凱撒沙律',     category: 'Food',     quantity: 1, allergyFlag: false, done: false },
      { id: 3, name: 'Espresso',              nameZh: '意式濃縮咖啡', category: 'Beverage', quantity: 3, allergyFlag: false, done: false },
      { id: 4, name: 'Tiramisu',              nameZh: '提拉米蘇',     category: 'Dessert',  quantity: 1, notes: 'No nuts', notesZh: '不加果仁', allergyFlag: true, done: false },
    ],
  },
  {
    id: 'KDS-002',
    posOrderNo: 'POS-20260316-000015',
    suiteName: 'Executive Suite B2', suiteNameZh: '行政廳 B2',
    guestName: 'Mrs Mary Johnson',
    guestCount: 2,
    placedAt: new Date(Date.now() - 5 * 60 * 1000),
    status: 'new',
    priority: 'normal',
    items: [
      { id: 5, name: 'Club Sandwich',            nameZh: '總匯三文治',      category: 'Food',     quantity: 2, allergyFlag: false, done: false },
      { id: 6, name: 'French Fries',             nameZh: '薯條',            category: 'Snack',    quantity: 2, allergyFlag: false, done: false },
      { id: 7, name: 'Sparkling Water (500 ml)', nameZh: '氣泡水 (500毫升)',category: 'Beverage', quantity: 2, allergyFlag: false, done: false },
    ],
  },
  {
    id: 'KDS-003',
    posOrderNo: 'POS-20260316-000009',
    suiteName: 'Premiere Suite C1', suiteNameZh: '首席廳 C1',
    guestName: 'Mr David Lee',
    guestCount: 4,
    placedAt: new Date(Date.now() - 9 * 60 * 1000),
    status: 'received',
    receivedAt: new Date(Date.now() - 7 * 60 * 1000),
    priority: 'normal',
    items: [
      { id: 8,  name: 'Wagyu Beef Burger', nameZh: '和牛漢堡',      category: 'Food',     quantity: 2, notes: 'Well done', notesZh: '全熟', allergyFlag: false, done: false },
      { id: 9,  name: 'Tom Yum Soup',      nameZh: '冬蔭功湯',      category: 'Food',     quantity: 2, allergyFlag: false, done: false },
      { id: 10, name: 'Red Wine (Glass)',   nameZh: '紅葡萄酒 (杯)', category: 'Beverage', quantity: 4, allergyFlag: false, done: false },
      { id: 11, name: 'Cheese Platter',    nameZh: '芝士拼盤',      category: 'Snack',    quantity: 1, allergyFlag: false, done: false },
    ],
  },
  {
    id: 'KDS-004',
    posOrderNo: 'POS-20260316-000007',
    suiteName: 'VIP Suite A2', suiteNameZh: 'VIP貴賓廳 A2',
    guestName: 'Miss Sarah Chen',
    guestCount: 1,
    placedAt: new Date(Date.now() - 14 * 60 * 1000),
    status: 'received',
    receivedAt: new Date(Date.now() - 12 * 60 * 1000),
    priority: 'normal',
    allergyAlert: 'Dairy, Eggs', allergyAlertZh: '乳製品、雞蛋',
    items: [
      { id: 12, name: 'Seasonal Fruit Bowl', nameZh: '時令鮮果盤', category: 'Food',     quantity: 1, allergyFlag: false, done: true },
      { id: 13, name: 'Green Tea',           nameZh: '綠茶',       category: 'Beverage', quantity: 1, allergyFlag: false, done: false },
    ],
  },
  {
    id: 'KDS-005',
    posOrderNo: 'POS-20260316-000003',
    suiteName: 'Business Suite D1', suiteNameZh: '商務廳 D1',
    guestName: 'Mr Robert Wang',
    guestCount: 2,
    placedAt: new Date(Date.now() - 22 * 60 * 1000),
    status: 'served',
    receivedAt: new Date(Date.now() - 20 * 60 * 1000),
    servedAt: new Date(Date.now() - 5 * 60 * 1000),
    priority: 'normal',
    items: [
      { id: 14, name: 'Dim Sum Set (3 pcs)', nameZh: '點心套餐 (3件)', category: 'Food',     quantity: 2, allergyFlag: false, done: true },
      { id: 15, name: 'Jasmine Tea',         nameZh: '茉莉花茶',       category: 'Beverage', quantity: 2, allergyFlag: false, done: true },
    ],
  },
  {
    id: 'KDS-006',
    posOrderNo: 'POS-20260316-000001',
    suiteName: 'Open Lounge', suiteNameZh: '開放式貴賓室',
    guestName: 'Mrs Emma Wilson',
    guestCount: 3,
    placedAt: new Date(Date.now() - 30 * 60 * 1000),
    status: 'served',
    receivedAt: new Date(Date.now() - 28 * 60 * 1000),
    servedAt: new Date(Date.now() - 12 * 60 * 1000),
    priority: 'normal',
    items: [
      { id: 16, name: 'Afternoon Tea Set', nameZh: '下午茶套餐', category: 'Food',     quantity: 3, allergyFlag: false, done: true },
      { id: 17, name: 'Cappuccino',        nameZh: '卡布奇諾',   category: 'Beverage', quantity: 2, allergyFlag: false, done: true },
      { id: 18, name: 'Orange Juice',      nameZh: '橙汁',       category: 'Beverage', quantity: 1, allergyFlag: false, done: true },
    ],
  },
];

// ── New-order pool ────────────────────────────────────────────────────────────
let _nextId = 7;
const NEW_ITEMS_POOL: Omit<KDSOrderItem, 'done'>[][] = [
  [
    { id: 100, name: 'Wagyu Beef Slider', nameZh: '和牛滑漢堡', category: 'Food',     quantity: 3, allergyFlag: false },
    { id: 101, name: 'Iced Lemon Tea',    nameZh: '凍檸茶',     category: 'Beverage', quantity: 3, allergyFlag: false },
  ],
  [
    { id: 102, name: 'Lobster Bisque',    nameZh: '龍蝦濃湯',   category: 'Food',     quantity: 1, allergyFlag: false },
    { id: 103, name: 'Sourdough Bread',   nameZh: '酸種麵包',   category: 'Snack',    quantity: 2, allergyFlag: false },
    { id: 104, name: 'Champagne (Glass)', nameZh: '香檳 (杯)',   category: 'Beverage', quantity: 1, allergyFlag: false },
  ],
  [
    { id: 105, name: 'Panna Cotta', nameZh: '奶凍',   category: 'Dessert',  quantity: 2, notes: 'Extra berry sauce', notesZh: '加多莓果醬', allergyFlag: false },
    { id: 106, name: 'Flat White',  nameZh: '馥芮白', category: 'Beverage', quantity: 2, allergyFlag: false },
  ],
];
const SUITES    = ['VIP Suite A3', 'Business Suite D2', 'Premiere Suite C2', 'Open Lounge'];
const SUITES_ZH = ['VIP貴賓廳 A3', '商務廳 D2', '首席廳 C2', '開放式貴賓室'];
const GUESTS    = ['Mr Kevin Zhang', 'Mrs Helen Yuen', 'Mr Daniel Ho', 'Miss Grace Liu'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function useElapsedTime(date: Date, lang: Lang): string {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - date.getTime()) / 1000);
      if (lang === 'zh') {
        if (diff < 60) return `${diff}秒`;
        return `${Math.floor(diff / 60)}分 ${diff % 60}秒`;
      } else {
        if (diff < 60) return `${diff}s`;
        return `${Math.floor(diff / 60)}m ${diff % 60}s`;
      }
    };
    setElapsed(calc());
    const interval = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(interval);
  }, [date, lang]);
  return elapsed;
}

function elapsedMinutes(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

// ── ElapsedBadge ──────────────────────────────────────────────────────────────
function ElapsedBadge({ since, warn, lang }: { since: Date; warn: number; lang: Lang }) {
  const elapsed = useElapsedTime(since, lang);
  const isWarn  = elapsedMinutes(since) >= warn;
  return (
    <span
      style={{ fontSize: '0.8em' }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono ${
        isWarn ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-600'
      }`}
    >
      <Clock className="w-3 h-3" />
      {elapsed}
    </span>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
interface OrderCardProps {
  order: KDSOrder;
  lang: Lang;
  onToggleItem: (orderId: string, itemId: number) => void;
  onMarkAll: (orderId: string) => void;
}

function OrderCard({ order, lang, onToggleItem, onMarkAll }: OrderCardProps) {
  const t = T[lang];
  const isNew      = order.status === 'new';
  const isReceived = order.status === 'received';
  const isServed   = order.status === 'served';

  const doneCount  = order.items.filter(i => i.done).length;
  const totalCount = order.items.length;
  const allDone    = doneCount === totalCount;
  const progress   = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const borderClass = isNew
    ? 'border-red-400 shadow-red-200'
    : isReceived
    ? 'border-amber-400 shadow-amber-100'
    : 'border-green-400 shadow-green-100';

  const itemActionLabel = isNew ? t.btnReceived : isReceived ? t.btnReady : null;

  return (
    <div className={`bg-white rounded-xl border-2 ${borderClass} shadow-md overflow-hidden flex flex-col`}>

      {/* Card Header */}
      <div className={`px-4 py-3 flex items-start justify-between gap-2 ${
        isNew ? 'bg-red-50' : isReceived ? 'bg-amber-50' : 'bg-green-50'
      }`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: '0.8em' }} className="font-mono text-gray-500">{order.id}</span>
            {order.priority === 'rush' && (
              <span style={{ fontSize: '0.85em' }} className="inline-flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                <AlertCircle className="w-3 h-3" /> {t.rush}
              </span>
            )}
            {order.allergyAlert && (
              <span style={{ fontSize: '0.85em' }} className="inline-flex items-center gap-1 bg-orange-500 text-white px-2 py-0.5 rounded-full">
                {t.allergyBadge}
              </span>
            )}
          </div>
          <p style={{ fontSize: '1.15em' }} className="font-semibold text-gray-900 mt-0.5 truncate">{order.guestName}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span style={{ fontSize: '0.85em' }} className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              {lang === 'zh' ? order.suiteNameZh : order.suiteName}
            </span>
            <span style={{ fontSize: '0.85em' }} className="flex items-center gap-1 text-gray-500">
              <Users className="w-3.5 h-3.5" /> {t.guests(order.guestCount)}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <ElapsedBadge since={order.placedAt} warn={isNew ? 5 : isReceived ? 15 : 999} lang={lang} />
          {isReceived && order.receivedAt && (
            <span style={{ fontSize: '0.78em' }} className="text-gray-400">
              {t.receivedAgo} <ElapsedBadge since={order.receivedAt} warn={999} lang={lang} />
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isServed && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: '0.85em' }} className="text-gray-500">
              {isNew ? t.itemsAcknowledged : t.itemsReady}
            </span>
            <span style={{ fontSize: '0.85em' }} className="font-semibold text-gray-700">{doneCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                allDone
                  ? isNew ? 'bg-blue-500' : 'bg-green-500'
                  : isNew ? 'bg-[#0f2942]' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Allergy Alert */}
      {order.allergyAlert && (
        <div className="mx-4 mt-3 px-3 py-2 bg-orange-50 border border-orange-300 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p style={{ fontSize: '0.9em' }} className="font-semibold text-orange-800">{t.allergyAlertTitle}</p>
            <p style={{ fontSize: '0.85em' }} className="text-orange-700">
              {lang === 'zh' ? (order.allergyAlertZh ?? order.allergyAlert) : order.allergyAlert}
            </p>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="px-4 py-3 flex-1 space-y-2">
        {order.items.map(item => (
          <div
            key={item.id}
            className={`flex items-stretch rounded-lg overflow-hidden transition-colors border ${
              item.done
                ? isServed
                  ? 'bg-green-50 border-green-200'
                  : isNew
                  ? 'bg-blue-50 border-blue-200 opacity-70'
                  : 'bg-green-50 border-green-200 opacity-70'
                : item.allergyFlag
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 p-2 flex-1 min-w-0">
              {/* Quantity bubble */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 font-bold transition-colors ${
                  item.done ? 'bg-gray-300 text-gray-500' : 'bg-[#05C9CC] text-white'
                }`}
                style={{ fontSize: '1.15em' }}
              >
                {item.quantity}×
              </div>
              <div className="flex-1 min-w-0">
                {/* Primary name */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    style={{ fontSize: '1.05em' }}
                    className={`font-medium transition-colors ${
                      item.done ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {lang === 'zh' ? item.nameZh : item.name}
                  </span>
                  {item.allergyFlag && !item.done && (
                    <span style={{ fontSize: '0.85em' }} className="text-orange-600">{t.checkAllergy}</span>
                  )}
                </div>
                {/* Secondary name */}
                <p style={{ fontSize: '0.82em' }} className="text-gray-400">
                  {lang === 'zh' ? item.name : item.nameZh}
                </p>
                {/* Notes */}
                {item.notes && (
                  <p style={{ fontSize: '0.85em' }} className="text-gray-500 mt-0.5 italic">
                    {lang === 'zh'
                      ? `「${item.notesZh ?? item.notes}」`
                      : `"${item.notes}"`}
                  </p>
                )}
                {/* Category badge */}
                <span
                  style={{ fontSize: '0.8em' }}
                  className={`inline-block mt-1 px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLOR[item.category]}`}
                >
                  {lang === 'zh' ? CATEGORY_LABEL[item.category].zh : CATEGORY_LABEL[item.category].en}
                </span>
              </div>
            </div>

            {/* Action button */}
            {!isServed && (
              <button
                onClick={() => onToggleItem(order.id, item.id)}
                style={{ fontSize: '0.9em' }}
                className={`shrink-0 flex flex-col items-center justify-center gap-1 px-5 font-semibold transition-all active:scale-95 border-l ${
                  item.done
                    ? 'bg-gray-400 border-gray-400 text-white hover:bg-gray-500'
                    : isNew
                    ? 'bg-[#05C9CC] border-[#05C9CC] text-white hover:bg-[#04b3b6]'
                    : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                }`}
                title={item.done ? t.btnUndo : itemActionLabel ?? ''}
              >
                {item.done ? (
                  <>
                    <CheckCheck className="w-5 h-5" />
                    <span>{t.btnUndo}</span>
                  </>
                ) : (
                  <>
                    {isNew ? <Eye className="w-5 h-5" /> : <CheckCheck className="w-5 h-5" />}
                    <span>{itemActionLabel}</span>
                  </>
                )}
              </button>
            )}

            {isServed && (
              <div className="flex items-center justify-center px-4 border-l border-green-200">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mark All button */}
      {!isServed && (
        <div className="px-4 pb-3">
          <button
            onClick={() => onMarkAll(order.id)}
            disabled={allDone}
            style={{ fontSize: '1em' }}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all active:scale-95 ${
              allDone
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isNew
                ? 'bg-[#05C9CC] hover:bg-[#04b3b6] text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <CheckCheck className="w-5 h-5" />
            {isNew ? t.markAllReceived : t.markAllReady}
          </button>
        </div>
      )}

      {/* Auto-advance hint */}
      {!isServed && allDone && (
        <div
          className={`mx-4 mb-4 px-3 py-2.5 rounded-lg flex items-center gap-2 font-semibold ${
            isNew
              ? 'bg-blue-100 border border-blue-300 text-blue-800'
              : 'bg-green-100 border border-green-300 text-green-800'
          }`}
          style={{ fontSize: '0.9em' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {isNew ? t.allAcknowledgedHint : t.allReadyHint}
        </div>
      )}

      {/* POS ref */}
      <div className="px-4 pb-3">
        <p style={{ fontSize: '0.78em' }} className="text-gray-400 font-mono">{order.posOrderNo}</p>
      </div>

      {/* Served stamp */}
      {isServed && (
        <div className="px-4 pb-4">
          <div style={{ fontSize: '0.95em' }} className="w-full py-2.5 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            {t.servedStamp}
            {order.servedAt && (
              <span style={{ fontSize: '0.85em' }} className="text-green-600 ml-1">
                · {order.servedAt.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function KitchenDisplay() {
  const [orders, setOrders]               = useState<KDSOrder[]>(SEED_ORDERS);
  const [soundOn, setSoundOn]             = useState(true);
  const [flashNew, setFlashNew]           = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab]         = useState<ActiveTab>('all');
  const [lang, setLang]                   = useState<Lang>('en');

  const t = T[lang];

  const newOrders      = orders.filter(o => o.status === 'new');
  const receivedOrders = orders.filter(o => o.status === 'received');
  const servedOrders   = orders.filter(o => o.status === 'served');

  const tabOrders: Record<ActiveTab, KDSOrder[]> = {
    all:      orders,
    new:      newOrders,
    received: receivedOrders,
    served:   servedOrders,
  };

  const tabCounts: Record<ActiveTab, number> = {
    all:      orders.length,
    new:      newOrders.length,
    received: receivedOrders.length,
    served:   servedOrders.length,
  };

  const tabEmptyMessages: Record<ActiveTab, string> = {
    all:      t.emptyAll,
    new:      t.emptyNew,
    received: t.emptyReceived,
    served:   t.emptyServed,
  };

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode; activeClass: string; badgeClass: string }[] = [
    { key: 'all',      label: t.tabAll,      icon: <LayoutGrid className="w-5 h-5" />,   activeClass: 'border-b-2 border-[#05C9CC] text-[#05C9CC] bg-cyan-50', badgeClass: 'bg-[#05C9CC] text-white' },
    { key: 'new',      label: t.tabNew,      icon: <Bell className="w-5 h-5" />,          activeClass: 'border-b-2 border-red-500 text-red-600 bg-red-50',      badgeClass: 'bg-red-500 text-white' },
    { key: 'received', label: t.tabReceived, icon: <Utensils className="w-5 h-5" />,      activeClass: 'border-b-2 border-amber-500 text-amber-600 bg-amber-50', badgeClass: 'bg-amber-500 text-white' },
    { key: 'served',   label: t.tabServed,   icon: <CheckCircle2 className="w-5 h-5" />,  activeClass: 'border-b-2 border-green-600 text-green-700 bg-green-50', badgeClass: 'bg-green-600 text-white' },
  ];

  const handleToggleItem = useCallback((orderId: string, itemId: number) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = order.items.map(item =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      const allDone = updatedItems.every(i => i.done);
      if (allDone && order.status === 'new') {
        const tCur = T[lang];
        toast.success(tCur.toastOrderReceived, { description: `${lang === 'zh' ? order.suiteNameZh : order.suiteName} — ${order.guestName}` });
        setTimeout(() => setActiveTab('received'), 600);
        return { ...order, items: updatedItems.map(i => ({ ...i, done: false })), status: 'received' as OrderStatus, receivedAt: new Date() };
      }
      if (allDone && order.status === 'received') {
        const tCur = T[lang];
        toast.success(tCur.toastFoodServed, { description: `${lang === 'zh' ? order.suiteNameZh : order.suiteName} — ${order.guestName}` });
        setTimeout(() => setActiveTab('served'), 600);
        return { ...order, items: updatedItems, status: 'served' as OrderStatus, servedAt: new Date() };
      }
      return { ...order, items: updatedItems };
    }));
  }, [lang]);

  const handleMarkAll = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = order.items.map(item => ({ ...item, done: true }));
      if (order.status === 'new') {
        const tCur = T[lang];
        toast.success(tCur.toastOrderReceived, { description: `${lang === 'zh' ? order.suiteNameZh : order.suiteName} — ${order.guestName}` });
        setTimeout(() => setActiveTab('received'), 600);
        return { ...order, items: updatedItems.map(i => ({ ...i, done: false })), status: 'received' as OrderStatus, receivedAt: new Date() };
      }
      if (order.status === 'received') {
        const tCur = T[lang];
        toast.success(tCur.toastFoodServed, { description: `${lang === 'zh' ? order.suiteNameZh : order.suiteName} — ${order.guestName}` });
        setTimeout(() => setActiveTab('served'), 600);
        return { ...order, items: updatedItems, status: 'served' as OrderStatus, servedAt: new Date() };
      }
      return { ...order, items: updatedItems };
    }));
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      const idx     = (_nextId - 7) % NEW_ITEMS_POOL.length;
      const suite   = SUITES[(_nextId) % SUITES.length];
      const suiteZh = SUITES_ZH[(_nextId) % SUITES_ZH.length];
      const guest   = GUESTS[(_nextId) % GUESTS.length];
      const newOrder: KDSOrder = {
        id: `KDS-${String(_nextId).padStart(3, '0')}`,
        posOrderNo: `POS-20260316-${String(_nextId * 7 + 20).padStart(6, '0')}`,
        suiteName: suite, suiteNameZh: suiteZh,
        guestName: guest,
        guestCount: 1 + (_nextId % 3),
        placedAt: new Date(),
        status: 'new',
        priority: _nextId % 5 === 0 ? 'rush' : 'normal',
        items: NEW_ITEMS_POOL[idx].map(i => ({ ...i, done: false })),
      };
      _nextId++;
      setOrders(prev => [newOrder, ...prev]);
      setFlashNew(true);
      setLastRefreshed(new Date());
      setTimeout(() => setFlashNew(false), 3000);
      if (soundOn) {
        const tCur = T[lang];
        toast.info(tCur.toastNewOrder, {
          description: `${lang === 'zh' ? suiteZh : suite} · ${guest}`,
          duration: 4000,
        });
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [soundOn, lang]);

  const handleManualRefresh = () => {
    setLastRefreshed(new Date());
    toast.info(t.toastRefreshed);
  };

  const currentOrders = tabOrders[activeTab];

  return (
    <div className="flex flex-col h-full bg-gray-100" style={{ fontSize: '1.125rem' }}>

      {/* Top bar */}
      <div className={`bg-[#0f2942] px-6 py-4 flex items-center justify-between gap-4 transition-all ${flashNew ? 'ring-4 ring-red-500 ring-inset' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1em' }} className="text-white font-semibold">{t.systemTitle}</h2>
            <p style={{ fontSize: '0.8em' }} className="text-blue-200">{t.systemSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontSize: '0.8em' }} className="text-blue-200 hidden sm:block">
            {t.refreshedAt} {lastRefreshed.toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>

          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            style={{ fontSize: '0.85em' }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors font-semibold"
            title="Switch Language / 切換語言"
          >
            <Languages className="w-4 h-4" />
            {t.switchLang}
          </button>

          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={t.refreshTitle}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSoundOn(p => !p)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={soundOn ? t.muteNotif : t.enableNotif}
          >
            {soundOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Flash banner */}
      {flashNew && (
        <div style={{ fontSize: '1em' }} className="bg-red-500 text-white text-center py-2 font-semibold animate-pulse">
          {t.newOrderBanner}
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 flex items-stretch">
        {TABS.map(tab => {
          const count    = tabCounts[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ fontSize: '1em' }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors focus:outline-none ${
                isActive
                  ? tab.activeClass
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                style={{ fontSize: '0.85em' }}
                className={`ml-1 min-w-[1.6em] h-[1.6em] rounded-full flex items-center justify-center font-bold px-1.5 ${
                  isActive
                    ? tab.badgeClass
                    : count > 0
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-gray-100 text-gray-400'
                } ${tab.key === 'new' && count > 0 && !isActive ? 'animate-pulse bg-red-100 text-red-600' : ''}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order cards grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle2 className="w-16 h-16 mb-3 opacity-20" />
            <p style={{ fontSize: '1em' }}>{tabEmptyMessages[activeTab]}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${activeTab === 'all' ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {currentOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                lang={lang}
                onToggleItem={handleToggleItem}
                onMarkAll={handleMarkAll}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center gap-6 flex-wrap text-gray-500" style={{ fontSize: '0.85em' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {t.legendNew}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> {t.legendReceived}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> {t.legendServed}
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-orange-600">
          <AlertCircle className="w-4 h-4" /> {t.legendAllergy}
        </span>
      </div>
    </div>
  );
}
