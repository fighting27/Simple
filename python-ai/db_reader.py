"""
数据库读取层 — 直接读 money-sys 的 SQLite 数据库
"""
import sqlite3
import os
from datetime import datetime, timedelta
from collections import defaultdict

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'money.db')


def get_db_path():
    """Return the SQLite database path shared with the Node.js service."""
    return os.path.abspath(os.environ.get('DB_PATH') or DEFAULT_DB_PATH)


def get_connection():
    """获取数据库连接（只读）"""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def get_transactions(start_date=None, end_date=None, type_filter=None, user_id=None):
    """获取交易记录"""
    conn = get_connection()
    query = """
        SELECT t.id, t.type, t.amount, t.category_id, t.note,
               t.transaction_date, c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE 1=1
    """
    params = []

    if start_date:
        query += " AND t.transaction_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND t.transaction_date <= ?"
        params.append(end_date)
    if type_filter:
        query += " AND t.type = ?"
        params.append(type_filter)
    if user_id is not None:
        query += " AND t.user_id = ?"
        params.append(int(user_id))

    query += " ORDER BY t.transaction_date DESC"

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_monthly_expenses(year, user_id=None):
    """获取某年每月支出"""
    conn = get_connection()
    rows = conn.execute("""
        SELECT strftime('%m', transaction_date) as month, SUM(amount) as total
        FROM transactions
        WHERE type = 'expense' AND strftime('%Y', transaction_date) = ?
          AND (? IS NULL OR user_id = ?)
        GROUP BY strftime('%m', transaction_date)
        ORDER BY month
    """, (str(year), user_id, user_id)).fetchall()
    conn.close()
    return {int(r['month']): r['total'] for r in rows}


def get_monthly_income(year, user_id=None):
    """获取某年每月收入"""
    conn = get_connection()
    rows = conn.execute("""
        SELECT strftime('%m', transaction_date) as month, SUM(amount) as total
        FROM transactions
        WHERE type = 'income' AND strftime('%Y', transaction_date) = ?
          AND (? IS NULL OR user_id = ?)
        GROUP BY strftime('%m', transaction_date)
        ORDER BY month
    """, (str(year), user_id, user_id)).fetchall()
    conn.close()
    return {int(r['month']): r['total'] for r in rows}


def get_category_expenses(year, month, user_id=None):
    """获取某月各分类支出"""
    conn = get_connection()
    month_str = f"{year}-{month:02d}"
    rows = conn.execute("""
        SELECT c.name as category, SUM(t.amount) as total, COUNT(*) as count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense' AND strftime('%Y-%m', t.transaction_date) = ?
          AND (? IS NULL OR t.user_id = ?)
        GROUP BY t.category_id
        ORDER BY total DESC
    """, (month_str, user_id, user_id)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_daily_expenses(year, month, user_id=None):
    """获取某月每日支出"""
    conn = get_connection()
    month_str = f"{year}-{month:02d}"
    rows = conn.execute("""
        SELECT strftime('%d', transaction_date) as day, SUM(amount) as total
        FROM transactions
        WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ?
          AND (? IS NULL OR user_id = ?)
        GROUP BY transaction_date
        ORDER BY day
    """, (month_str, user_id, user_id)).fetchall()
    conn.close()
    return {int(r['day']): r['total'] for r in rows}


def get_recent_transactions(limit=50, user_id=None):
    """获取最近的交易记录"""
    conn = get_connection()
    rows = conn.execute("""
        SELECT t.id, t.type, t.amount, t.note, t.transaction_date,
               c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE (? IS NULL OR t.user_id = ?)
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT ?
    """, (user_id, user_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_settings(user_id=None):
    """获取用户设置"""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT key, value FROM settings
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY CASE WHEN user_id IS NULL THEN 0 ELSE 1 END
        """,
        (user_id,),
    ).fetchall()
    conn.close()
    return {r['key']: r['value'] for r in rows}
