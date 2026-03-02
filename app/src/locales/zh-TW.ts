export default {
  common: {
    save: '儲存',
    cancel: '取消',
    delete: '刪除',
    loading: '載入中...',
    on: '開啟',
    off: '關閉'
  },
  nav: {
    home: '首頁',
    blocklist: '封鎖名單',
    stats: '統計',
    settings: '一般設定'
  },
  home: {
    title: '專注模式',
    globalProtection: '全局防護',
    current: '當前網站',
    none: '無',
    focusing: '專注中',
    minutes: '分鐘',
    reset: '重置',
    addTime: '+5分',
    quickActions: '快速操作',
    lockSite: '封鎖此網站',
    allowSite: '允許此網站',
    lockedMsg: '已封鎖 {domain}',
    allowedMsg: '已允許 {domain}',
    alreadyInList: '已在清單中'
  },
  blocklist: {
    title: '封鎖名單',
    addDomain: '輸入網域 (例如: youtube.com)',
    blocked: '已封鎖',
    whitelisted: '白名單',
    emptyBlocked: '目前沒有封鎖任何網站。',
    emptyWhitelisted: '目前沒有任何白名單。'
  },
  stats: {
    title: '統計資料',
    todayOptions: {
      today: '今天',
      days7: '近 7 天',
      days30: '近 30 天'
    },
    totalScreenTime: '專注總時長',
    dailyFocusTrends: '每日專注趨勢',
    topSites: '熱門造訪網站',
    emptyTopSites: '今天尚無數據。',
    timeFormat: {
      h: '小時',
      m: '分鐘'
    }
  },
  settings: {
    title: '一般設定',
    blockBehavior: '封鎖行為設定',
    snoozeDuration: '貪睡時間 (Snooze)',
    snoozeDesc: '暫時忽略封鎖的分鐘數',
    strictMode: '嚴格模式',
    strictDesc: '在封鎖頁面上隱藏貪睡與忽略按鈕',
    notifications: '通知設定',
    timerAlerts: '計時器提醒',
    timerAlertsDesc: '專注計時結束時發送系統通知',
    blockerMessage: '封鎖訊息',
    customMessage: '顯示在封鎖頁面上的自訂訊息',
    advanced: '進階設定',
    language: '顯示語言',
    exportData: '匯出資料',
    importData: '匯入資料',
    clearAll: '清除所有資料',
    clearDesc: '這將會永久刪除所有的統計數據、名單與設定。',
    clearWarningTitle: '確定要清除所有資料嗎？',
    clearWarningBody: '此操作無法還原。所有的統計數據與封鎖名單都將永久遺失。',
    confirmDelete: '是的，全部刪除'
  },
  overlay: {
    title: 'Limina 阻擋了此網站',
    defaultMessage: 'You shall not pass! 🧙‍♂️',
    snooze: '⏱ 讓我休息 {min} 分鐘',
    ignore: '我知道了，關閉提醒',
    footer: 'Limina 2.0 — 廢宅計時器'
  }
}
