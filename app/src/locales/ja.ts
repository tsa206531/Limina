export default {
  common: {
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    loading: '読み込み中...',
    on: 'オン',
    off: 'オフ'
  },
  nav: {
    home: 'ホーム',
    blocklist: 'ブロックリスト',
    stats: '統計',
    settings: '設定'
  },
  home: {
    title: 'フォーカスモード',
    globalProtection: 'グローバル保護',
    current: '現在のサイト',
    none: 'なし',
    focusing: '集中',
    minutes: '分',
    reset: 'リセット',
    addTime: '+5分',
    quickActions: 'クイックアクション',
    lockSite: 'ブロックする',
    allowSite: '許可する',
    lockedMsg: '{domain} をブロックしました',
    allowedMsg: '{domain} を許可しました',
    alreadyInList: '既にリストにあります'
  },
  blocklist: {
    title: 'ブロックリスト',
    addDomain: 'ドメインを入力 (例: youtube.com)',
    blocked: 'ブロック中',
    whitelisted: 'ホワイトリスト',
    emptyBlocked: 'ブロックされたサイトはありません。',
    emptyWhitelisted: 'ホワイトリストはありません。'
  },
  stats: {
    title: '統計データ',
    todayOptions: {
      today: '今日',
      days7: '過去 7 日間',
      days30: '過去 30 日間'
    },
    totalScreenTime: '合計集中時間',
    dailyFocusTrends: '日別トレンド',
    topSites: 'トップサイト',
    emptyTopSites: '今日のデータはまだありません。',
    timeFormat: {
      h: '時間',
      m: '分'
    }
  },
  settings: {
    title: '設定',
    blockBehavior: 'ブロックの動作',
    snoozeDuration: 'スヌーズ時間',
    snoozeDesc: '一時的にブロックを無視する分数',
    strictMode: '厳格モード',
    strictDesc: 'ブロック画面でスヌーズと無視ボタンを非表示にする',
    notifications: '通知',
    timerAlerts: 'タイマー通知',
    timerAlertsDesc: 'タイマー終了時にデスクトップ通知を受け取る',
    blockerMessage: 'ブロックメッセージ',
    customMessage: 'ブロック画面に表示されるカスタムメッセージ',
    advanced: '詳細設定',
    language: '言語',
    exportData: 'データのエクスポート',
    importData: 'データのインポート',
    clearAll: '全データ削除',
    clearDesc: 'すべての統計データと設定を完全に削除します。',
    clearWarningTitle: 'すべてのデータを削除しますか？',
    clearWarningBody: 'この操作は元に戻せません。すべての統計とブロックリストが失われます。',
    confirmDelete: 'はい、すべて削除します'
  },
  overlay: {
    title: 'Limina がこのウェブサイトをブロックしました',
    defaultMessage: 'You shall not pass! 🧙‍♂️',
    snooze: '⏱ {min} 分だけ休む',
    ignore: 'わかった。閉じる',
    footer: 'Limina 2.0 — プロダクティビティ・タイマー'
  }
}
