# Home Improvement Local

A lead-generation website for home improvement / trades, modeled on
[MyBuilder](https://www.mybuilder.com), [Checkatrade](https://www.checkatrade.com)
and [HomeAdvisor](https://www.homeadvisor.com). Homeowners post a job (free),
browse vetted local trades by category, read verified reviews, and request
quotes. Tradespeople join to receive local job leads.

The data layer is **Airtable** — a no-code database you can manage from a
spreadsheet-like UI. The public site can be built in two ways:

| Approach | Effort | Best for |
|---|---|---|
| **Softr** (recommended) | Low, no code | Live site fast, Airtable token stays server-side (safe) |
| **Static site + Netlify** | Low | Full control of design; uses the `app.js` in this folder |

Both read from the **same Airtable base**.

---

## 1. The Airtable data model

Create a base (any name, e.g. "Home Improvement Local") with **three tables**:

### `Categories`  (trade categories shown on the home page)
| Field | Type | Notes |
|---|---|---|
| `Name` | Single line text (primary) | e.g. "Plumbing" |
| `Icon` | Single line text | an emoji, e.g. "🔧" |
| `Count` | Single line text | e.g. "1,200+ pros" (display only) |

### `Reviews`  (verified customer reviews)
| Field | Type | Notes |
|---|---|---|
| `Review` | Long text (primary) | the review text |
| `Rating` | Number | 1–5 |
| `Author` | Single line text | reviewer name |
| `Location` | Single line text | city / area |

### `Jobs`  (homeowner job leads — the money table)
| Field | Type | Notes |
|---|---|---|
| `Name` | Single line text (primary) | homeowner name |
| `Email` | Email | contact email |
| `Phone` | Phone | contact phone |
| `Category` | Single line text | chosen trade |
| `Location` | Single line text | city / ZIP |
| `Description` | Long text | job details |
| `Status` | Single select | options: New, Contacted, Hired, Closed |

### Auto-create the schema
If you have a blank base, run the helper script to add the three tables and
fields for you (needs Python 3 + `requests`):

```bash
export AIRTABLE_API_KEY="pat..."        # your Personal Access Token
export AIRTABLE_BASE_ID="app..."         # the base you created
pip install requests
python3 airtable_setup.py
```

The token needs scopes `schema.bases:write` (to add tables) and
`data.records:write`, plus the base added to the token's Access list.

---

## 2. Option A — Publish with Softr (fastest, safest)

1. Go to https://www.softr.io/ and sign up.
2. Create a new app → choose **"Airtable"** as the data source.
3. Connect the base from step 1.
4. Add blocks:
   - **List / Grid** bound to `Categories` for the homepage categories.
   - **List** bound to `Reviews` for the reviews section.
   - **Form** bound to `Jobs` (Name, Email, Phone, Category, Location,
     Description) so homeowner submissions land directly in Airtable.
   - A **CTA / Hero** block for "Post a job".
5. Publish. Your domain e.g. `homeimprovementlocal.softr.app` (custom domain later).

Softr keeps your Airtable token server-side, so this is safe to make public.

---

## 3. Option B — Static site (this folder) + Netlify

The files `index.html`, `styles.css`, `app.js` are a complete static site.

**Local preview:**

```bash
cd home-improvement-local
python3 -m http.server 8000
# open http://localhost:8000
```

**Go live (free) on Netlify:**

```bash
# from this folder
netlify deploy --prod --dir .
# or drag the folder onto https://app.netlify.com/drop
```

**Connect Airtable:** copy `config.js.example` to `config.js`, fill in
`baseId`, `token`, and table names, then reload. ⚠️ A token in `config.js` is
visible to site visitors — only do this for localhost, or point `apiBase` at a
serverless proxy that holds the token. For a public static site, prefer Softr
or a Cloudflare Worker proxy.

In demo mode (no `config.js`) the site renders seed data and the form logs the
lead to the browser console — useful for design review before going live.

---

## 4. Monetization hooks (next steps)

- Charge trades a monthly fee or per-lead fee to access `Jobs`.
- "Featured pro" paid placement in the category grid.
- Lead routing: when a `Job` is created, notify matched local pros (Airtable
  Automations or Zapier) and bill per introduction.
