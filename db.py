import sqlite3
import json
from datetime import datetime, date
from typing import List, Dict, Any, Optional

DB_PATH = "dukaan.db"


def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH):
    """Initializes the cards table with indexing."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            person TEXT,
            item TEXT,
            amount REAL DEFAULT 0.0,
            advance REAL DEFAULT 0.0,
            balance_due REAL DEFAULT 0.0,
            due_date TEXT,
            notes TEXT,
            status TEXT DEFAULT 'open',
            backend_used TEXT DEFAULT 'local',
            used_cloud INTEGER DEFAULT 0,
            card_json TEXT NOT NULL,
            customer_email TEXT,
            customer_phone TEXT
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_person ON cards(person)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_shop_type ON cards(shop_type)")
    conn.commit()
    conn.close()


def save_card(
    card_data: Dict[str, Any],
    backend_used: str = "local",
    used_cloud: bool = False,
    customer_email: Optional[str] = None,
    customer_phone: Optional[str] = None,
    db_path: str = DB_PATH
) -> int:
    """Saves a card into SQLite database and returns inserted card ID."""
    conn = get_connection(db_path)
    cursor = conn.cursor()

    shop_type = card_data.get("shop_type", "tailor")
    person = card_data.get("person")
    item = card_data.get("item")
    amount = float(card_data.get("amount") or 0.0)
    advance = float(card_data.get("advance") or 0.0)
    balance = float(card_data.get("balance_due") or (amount - advance))
    due_date = card_data.get("due_date")
    if isinstance(due_date, (date, datetime)):
        due_date = due_date.isoformat()

    notes = card_data.get("notes", "")
    created_at = datetime.now().isoformat()
    card_json_str = json.dumps(card_data, ensure_ascii=False)

    cursor.execute("""
        INSERT INTO cards (
            shop_type, created_at, person, item, amount, advance,
            balance_due, due_date, notes, status, backend_used,
            used_cloud, card_json, customer_email, customer_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
    """, (
        shop_type, created_at, person, item, amount, advance,
        balance, due_date, notes, backend_used, 1 if used_cloud else 0,
        card_json_str, customer_email, customer_phone
    ))
    card_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return card_id


def list_cards(
    status: Optional[str] = None,
    shop_type: Optional[str] = None,
    person_query: Optional[str] = None,
    db_path: str = DB_PATH
) -> List[Dict[str, Any]]:
    """Lists cards matching criteria, ordered by newest first."""
    conn = get_connection(db_path)
    cursor = conn.cursor()

    query = "SELECT * FROM cards WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if shop_type:
        query += " AND shop_type = ?"
        params.append(shop_type)
    if person_query:
        query += " AND person LIKE ?"
        params.append(f"%{person_query}%")

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    results = []
    for r in rows:
        item = dict(r)
        try:
            item["parsed_card"] = json.loads(item["card_json"])
        except Exception:
            item["parsed_card"] = {}
        results.append(item)

    conn.close()
    return results


def mark_done(card_id: int, db_path: str = DB_PATH) -> bool:
    """Marks a card status as done."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE cards SET status = 'done' WHERE id = ?", (card_id,))
    changed = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return changed


def delete_card(card_id: int, db_path: str = DB_PATH) -> bool:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    changed = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return changed


def list_people(shop_type: Optional[str] = None, db_path: str = DB_PATH) -> List[str]:
    """Returns distinct customer names for auto-complete/fuzzy matching."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    if shop_type:
        cursor.execute("SELECT DISTINCT person FROM cards WHERE shop_type = ? AND person IS NOT NULL AND person != '' ORDER BY person", (shop_type,))
    else:
        cursor.execute("SELECT DISTINCT person FROM cards WHERE person IS NOT NULL AND person != '' ORDER BY person")
    names = [row["person"] for row in cursor.fetchall()]
    conn.close()
    return names


def latest_card_for_person(person_name: str, shop_type: Optional[str] = None, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    """Returns the latest card for a customer (e.g. for tailor 'use previous measurements')."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    if shop_type:
        cursor.execute("SELECT * FROM cards WHERE person = ? AND shop_type = ? ORDER BY id DESC LIMIT 1", (person_name, shop_type))
    else:
        cursor.execute("SELECT * FROM cards WHERE person = ? ORDER BY id DESC LIMIT 1", (person_name,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["parsed_card"] = json.loads(d["card_json"])
    return d
