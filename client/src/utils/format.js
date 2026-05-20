import dayjs from 'dayjs'

// 格式化金额
export function formatAmount(amount, prefix = '¥') {
  if (amount === null || amount === undefined) return `${prefix}0.00`
  return `${prefix}${Number(amount).toFixed(2)}`
}

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  return dayjs(date).format(format)
}

// 格式化日期时间
export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

// 获取今日日期
export function getToday() {
  return dayjs().format('YYYY-MM-DD')
}

// 获取本月起止日期
export function getMonthRange() {
  return {
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  }
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
