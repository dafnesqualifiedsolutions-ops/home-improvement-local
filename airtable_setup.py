#!/usr/bin/env python3
"""
Create the three tables (Categories, Reviews, Jobs) and their fields inside an
existing blank Airtable base.

Requires:
  - AIRTABLE_API_KEY  (Personal Access Token, scopes: schema.bases:write,
                       data.records:read/write; base added to Access list)
  - AIRTABLE_BASE_ID (the "app..." id of a base you created)
  - Python requests:  pip install requests

Run:  python3 airtable_setup.py
"""
import os
import sys
import json
import urllib.request

API = "https://api.airtable.com/v0"
TOKEN = os.environ.get("AIRTABLE_API_KEY")
BASE_ID = os.environ.get("AIRTABLE_BASE_ID")

if not TOKEN or not BASE_ID:
    sys.exit("Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID first.")

# field builders ------------------------------------------------------------
def f_text(name, primary=False):
    return {"name": name, "type": "singleLineText", "description": ""}

def f_long(name):
    return {"name": name, "type": "multilineText"}

def f_num(name):
    return {"name": name, "type": "number", "options": {"precision": 0}}

def f_email(name):
    return {"name": name, "type": "email"}

def f_phone(name):
    return {"name": name, "type": "phoneNumber"}

def f_select(name, options):
    return {
        "name": name,
        "type": "singleSelect",
        "options": {"choices": [{"name": o} for o in options]},
    }

TABLES = [
    {
        "name": "Categories",
        "description": "Trade categories shown on the home page.",
        "fields": [
            f_text("Name", primary=True),
            f_text("Icon"),
            f_text("Count"),
        ],
    },
    {
        "name": "Reviews",
        "description": "Verified customer reviews.",
        "fields": [
            f_long("Review",),
            f_num("Rating"),
            f_text("Author"),
            f_text("Location"),
        ],
    },
    {
        "name": "Jobs",
        "description": "Homeowner job leads captured from the site.",
        "fields": [
            f_text("Name", primary=True),
            f_email("Email"),
            f_phone("Phone"),
            f_text("Category"),
            f_text("Location"),
            f_long("Description"),
            f_select("Status", ["New", "Contacted", "Hired", "Closed"]),
        ],
    },
]

def request(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return r.read().decode()
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()}")

def main():
    for t in TABLES:
        print(f"Creating table '{t['name']}' …")
        request("POST", f"{API}/meta/bases/{BASE_ID}/tables", t)
        print(f"  ✓ {t['name']} created with {len(t['fields'])} fields")
    print("\nDone. Open your base — you should see Categories, Reviews, Jobs.")

if __name__ == "__main__":
    main()
