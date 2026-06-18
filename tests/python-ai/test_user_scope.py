import os
import shutil
import sqlite3
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "python-ai")))

import db_reader


original_db_path = os.environ.get("DB_PATH")


def create_test_db(path):
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode = OFF")
    conn.execute("PRAGMA temp_store = MEMORY")
    conn.executescript(
        """
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          is_default INTEGER DEFAULT 0,
          user_id INTEGER DEFAULT NULL
        );

        CREATE TABLE transactions (
          id INTEGER PRIMARY KEY,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          category_id INTEGER NOT NULL,
          note TEXT DEFAULT '',
          transaction_date TEXT NOT NULL,
          created_at TEXT DEFAULT '',
          user_id INTEGER NOT NULL
        );

        CREATE TABLE settings (
          id INTEGER PRIMARY KEY,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          user_id INTEGER DEFAULT NULL
        );
        """
    )
    conn.executemany(
        "INSERT INTO categories (id, name, type, is_default, user_id) VALUES (?, ?, ?, ?, ?)",
        [
            (1, "餐饮", "expense", 1, None),
            (2, "工资", "income", 1, None),
        ],
    )
    conn.executemany(
        """
        INSERT INTO transactions
          (id, type, amount, category_id, note, transaction_date, created_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (1, "expense", 100, 1, "user one", "2026-06-01", "2026-06-01", 1),
            (2, "expense", 999, 1, "user two", "2026-06-01", "2026-06-01", 2),
            (3, "income", 500, 2, "income one", "2026-06-02", "2026-06-02", 1),
        ],
    )
    conn.executemany(
        "INSERT INTO settings (key, value, user_id) VALUES (?, ?, ?)",
        [
            ("monthly_budget", "1000", 1),
            ("monthly_budget", "9000", 2),
        ],
    )
    conn.commit()
    conn.close()


try:
    tmp = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", ".test-user-scope"))
    if os.path.exists(tmp):
        shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    try:
        db_path = os.path.join(tmp, f"money-{uuid.uuid4().hex}.db")
        create_test_db(db_path)
        os.environ["DB_PATH"] = db_path

        user_one_expenses = db_reader.get_category_expenses(2026, 6, user_id=1)
        assert len(user_one_expenses) == 1
        assert user_one_expenses[0]["total"] == 100

        user_two_expenses = db_reader.get_category_expenses(2026, 6, user_id=2)
        assert len(user_two_expenses) == 1
        assert user_two_expenses[0]["total"] == 999

        user_one_income = db_reader.get_monthly_income(2026, user_id=1)
        assert user_one_income[6] == 500

        user_one_settings = db_reader.get_settings(user_id=1)
        assert user_one_settings["monthly_budget"] == "1000"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
finally:
    if original_db_path is None:
        os.environ.pop("DB_PATH", None)
    else:
        os.environ["DB_PATH"] = original_db_path

print("db_reader user scope tests passed")
