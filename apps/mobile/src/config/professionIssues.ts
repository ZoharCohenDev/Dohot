import type { Profession } from '@dohot/shared';

export interface IssueOption {
  id: string;       // profession-specific key
  label: string;    // Hebrew display label
  desc: string;     // short description
  color: string;
  bg: string;
  icon: 'drop' | 'pipe' | 'roof' | 'moisture' | 'sparkle' | 'building' | 'shield' | 'more';
}

export const PROFESSION_ISSUES: Record<Profession, IssueOption[]> = {
  leak_detection: [
    { id: 'leak',        label: 'איתור נזילה',  desc: 'גילוי מקור הנזילה',  color: '#C2613B', bg: '#F8E9DF', icon: 'drop' },
    { id: 'pipe_leak',   label: 'נזילת צינור',  desc: 'פריצה, קורוזיה',    color: '#4A7B9D', bg: '#E2EBF1', icon: 'pipe' },
    { id: 'roof_leak',   label: 'נזילת גג',     desc: 'חדירת מים',         color: '#5A8770', bg: '#E5EDE7', icon: 'roof' },
    { id: 'wall_moisture', label: 'לחות בקיר',  desc: 'ספיגה, עובש',       color: '#8B5A8B', bg: '#EFE0EF', icon: 'moisture' },
    { id: 'floor_leak',  label: 'נזילת רצפה',  desc: 'תחת אריחים',         color: '#B8862B', bg: '#F4ECD7', icon: 'drop' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  plumber: [
    { id: 'pipe_burst',  label: 'פיצוץ צינור',  desc: 'נזק חמור',          color: '#C2613B', bg: '#F8E9DF', icon: 'pipe' },
    { id: 'tap_drip',   label: 'טפטוף ברז',    desc: 'ניקוז, אטימה',      color: '#4A7B9D', bg: '#E2EBF1', icon: 'drop' },
    { id: 'toilet',     label: 'תקלת אסלה',    desc: 'שטיפה, נזילה',      color: '#5A8770', bg: '#E5EDE7', icon: 'pipe' },
    { id: 'boiler',     label: 'דוד מים',       desc: 'חימום, לחץ',        color: '#B8862B', bg: '#F4ECD7', icon: 'sparkle' },
    { id: 'drainage',   label: 'סתימה',         desc: 'פתיחת ניקוז',       color: '#8B5A8B', bg: '#EFE0EF', icon: 'pipe' },
    { id: 'other',      label: 'אחר',           desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  electrician: [
    { id: 'short_circuit', label: 'קצר חשמלי', desc: 'חיווי, בטיחות',     color: '#C2613B', bg: '#F8E9DF', icon: 'sparkle' },
    { id: 'panel',       label: 'לוח חשמל',     desc: 'ממסרים, כבלים',    color: '#B8862B', bg: '#F4ECD7', icon: 'sparkle' },
    { id: 'outlet',      label: 'שקע / מפסק',  desc: 'החלפה, תיקון',      color: '#4A7B9D', bg: '#E2EBF1', icon: 'sparkle' },
    { id: 'lighting',    label: 'תאורה',        desc: 'נורות, מתקנים',     color: '#5A8770', bg: '#E5EDE7', icon: 'sparkle' },
    { id: 'ac_wiring',   label: 'חיווט מזגן',  desc: 'כבל, אינוורטר',     color: '#8B5A8B', bg: '#EFE0EF', icon: 'sparkle' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  renovation: [
    { id: 'tiling',      label: 'ריצוף / חיפוי', desc: 'שבירה, החלפה',    color: '#C2613B', bg: '#F8E9DF', icon: 'building' },
    { id: 'painting',    label: 'צביעה',         desc: 'קילוף, לחות',      color: '#4A7B9D', bg: '#E2EBF1', icon: 'building' },
    { id: 'plastering',  label: 'טיח',           desc: 'סדקים, נפילה',     color: '#B8862B', bg: '#F4ECD7', icon: 'building' },
    { id: 'carpentry',   label: 'נגרות',         desc: 'דלתות, ארונות',    color: '#5A8770', bg: '#E5EDE7', icon: 'building' },
    { id: 'demolition',  label: 'פירוק / הריסה', desc: 'קירות, מחיצות',   color: '#8B5A8B', bg: '#EFE0EF', icon: 'building' },
    { id: 'other',       label: 'אחר',           desc: 'תיאור חופשי',      color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  ac: [
    { id: 'no_cooling',  label: 'לא מקרר',      desc: 'גז, קומפרסור',      color: '#4A7B9D', bg: '#E2EBF1', icon: 'more' },
    { id: 'ac_leak',     label: 'נזילת מים',    desc: 'ניקוז, צינור',      color: '#5A8770', bg: '#E5EDE7', icon: 'drop' },
    { id: 'noisy',       label: 'רעש חריג',     desc: 'רוח, מאוורר',       color: '#8B5A8B', bg: '#EFE0EF', icon: 'more' },
    { id: 'installation', label: 'התקנה',       desc: 'מזגן חדש',          color: '#C2613B', bg: '#F8E9DF', icon: 'more' },
    { id: 'maintenance', label: 'תחזוקה',       desc: 'ניקוי, שנתית',      color: '#B8862B', bg: '#F4ECD7', icon: 'more' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  roofing: [
    { id: 'roof_leak2',  label: 'נזילה',        desc: 'חדירת מים',         color: '#4A7B9D', bg: '#E2EBF1', icon: 'roof' },
    { id: 'crack',       label: 'סדקים',        desc: 'שבר, עיוות',        color: '#C2613B', bg: '#F8E9DF', icon: 'roof' },
    { id: 'membrane',    label: 'איטום גג',     desc: 'ממברנה, ציפוי',     color: '#5A8770', bg: '#E5EDE7', icon: 'shield' },
    { id: 'drainage',    label: 'ניקוז גג',     desc: 'מרזבים, קולטים',   color: '#B8862B', bg: '#F4ECD7', icon: 'drop' },
    { id: 'tiles',       label: 'רעפים',        desc: 'שבירה, החלפה',      color: '#8B5A8B', bg: '#EFE0EF', icon: 'roof' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  waterproofing: [
    { id: 'basement',    label: 'מרתף',         desc: 'חדירה, רטיבות',     color: '#4A7B9D', bg: '#E2EBF1', icon: 'drop' },
    { id: 'bathroom',    label: 'חדר רחצה',     desc: 'דליפה, ריח',        color: '#5A8770', bg: '#E5EDE7', icon: 'drop' },
    { id: 'balcony',     label: 'מרפסת',        desc: 'חדירה, נזקים',      color: '#C2613B', bg: '#F8E9DF', icon: 'building' },
    { id: 'pool',        label: 'בריכה',        desc: 'אובדן מים',         color: '#B8862B', bg: '#F4ECD7', icon: 'drop' },
    { id: 'flat_roof',   label: 'גג שטוח',     desc: 'ממברנה, ביטום',     color: '#8B5A8B', bg: '#EFE0EF', icon: 'shield' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  general_technician: [
    { id: 'electrical',  label: 'חשמל',         desc: 'תקלה חשמלית',       color: '#B8862B', bg: '#F4ECD7', icon: 'sparkle' },
    { id: 'plumbing',    label: 'אינסטלציה',    desc: 'צנרת, ברזים',       color: '#4A7B9D', bg: '#E2EBF1', icon: 'pipe' },
    { id: 'ac_repair',   label: 'מיזוג',        desc: 'קירור, חימום',      color: '#5A8770', bg: '#E5EDE7', icon: 'more' },
    { id: 'doors_windows', label: 'דלתות/חלונות', desc: 'תיקון, החלפה',  color: '#C2613B', bg: '#F8E9DF', icon: 'building' },
    { id: 'general',     label: 'תיקון כללי',   desc: 'שונות',             color: '#8B5A8B', bg: '#EFE0EF', icon: 'more' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
  other: [
    { id: 'inspection',  label: 'בדיקה',        desc: 'בדיקת מצב',         color: '#4A7B9D', bg: '#E2EBF1', icon: 'more' },
    { id: 'maintenance', label: 'תחזוקה',       desc: 'טיפול שוטף',        color: '#5A8770', bg: '#E5EDE7', icon: 'more' },
    { id: 'installation', label: 'התקנה',       desc: 'מוצר חדש',          color: '#C2613B', bg: '#F8E9DF', icon: 'more' },
    { id: 'repair',      label: 'תיקון',        desc: 'שחזור, תיקון',      color: '#B8862B', bg: '#F4ECD7', icon: 'more' },
    { id: 'consultation', label: 'ייעוץ',       desc: 'חוות דעת',          color: '#8B5A8B', bg: '#EFE0EF', icon: 'more' },
    { id: 'other',       label: 'אחר',          desc: 'תיאור חופשי',       color: '#807A72', bg: '#EFEDE7', icon: 'more' },
  ],
};
