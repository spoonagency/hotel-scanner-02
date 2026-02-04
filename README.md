# 🏨 Norwegian Hotel SEO Scanner (Real Data)

An automated tool that fetches **real company data** from Brønnøysundregistrene (Norwegian Business Registry) and performs **live SEO analysis** on hotel websites.

## ✨ Features

- **Real Data**: Fetches actual Norwegian accommodation businesses from the official Brønnøysund API
- **Live SEO Analysis**: Visits actual websites and checks:
  - HTTPS/SSL
  - Title tags
  - Meta descriptions
  - H1 headings
  - Image alt tags
  - Mobile viewport
  - Open Graph tags
  - Page size
  - Structured data (Schema.org)
  - Canonical tags
- **Opportunity Scoring**: Ranks businesses by their potential as SEO clients
- **Export**: Download results as CSV or JSON
- **Beautiful UI**: Modern React frontend with real-time progress

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Start the Backend (Python API)

```bash
# Navigate to the project folder
cd norwegian-hotel-scanner-real

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
python server.py
```

The API will run at `http://localhost:5000`

### 2. Start the Frontend (React)

```bash
# In a new terminal, navigate to frontend
cd norwegian-hotel-scanner-real/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will run at `http://localhost:5173`

### 3. Use the Scanner

1. Open `http://localhost:5173` in your browser
2. Select a municipality (or leave blank to scan all of Norway)
3. Set the maximum number of companies to analyze
4. Click "Start Scan"
5. Wait for real-time results!

## 🖥️ Command Line Usage

You can also use the scanner directly from the command line:

```bash
# Scan all of Norway (max 30 companies)
python scanner.py

# Scan a specific municipality
python scanner.py --municipality 0301  # Oslo

# Scan more companies
python scanner.py --municipality 4601 --max 50  # Bergen, 50 companies

# Export to specific format
python scanner.py -m 0301 -n 20 --format csv

# Sequential mode (slower but gentler on servers)
python scanner.py --sequential
```

### Available Municipality Codes

| Code | City | Region |
|------|------|--------|
| 0301 | Oslo | Oslo |
| 4601 | Bergen | Vestland |
| 5001 | Trondheim | Trøndelag |
| 1103 | Stavanger | Rogaland |
| 1902 | Tromsø | Troms og Finnmark |
| 1001 | Kristiansand | Agder |
| 3005 | Drammen | Viken |
| 3024 | Bærum | Viken |

## 📊 Data Sources

### Brønnøysundregistrene API (Free, Official)
- **URL**: https://data.brreg.no/
- **Data**: Company names, org numbers, addresses, employee counts, industry codes
- **Rate Limit**: No official limit, but please be respectful

### Live Website Analysis
- Fetches actual hotel websites
- Analyzes HTML for SEO factors
- Respects rate limits (1 second delay between requests in sequential mode)

## 📁 Project Structure

```
norwegian-hotel-scanner-real/
├── scanner.py          # Core scanning logic
├── server.py           # Flask API server
├── requirements.txt    # Python dependencies
├── README.md           # This file
└── frontend/           # React frontend
    ├── src/
    │   ├── App.jsx     # Main React component
    │   ├── main.jsx    # Entry point
    │   └── index.css   # Tailwind CSS
    ├── package.json
    └── vite.config.js
```

## 🔍 SEO Scoring Criteria

| Factor | Points | Criteria |
|--------|--------|----------|
| HTTPS | 10 | Uses secure connection |
| Title Tag | 15 | Present and 30-60 chars |
| Meta Description | 15 | Present and 120-160 chars |
| H1 Tag | 15 | Exactly one H1 tag |
| Image Alt Tags | 10 | All images have alt text |
| Mobile Viewport | 10 | Has viewport meta tag |
| Open Graph | 5 | Has 3+ OG tags |
| Page Size | 10 | Under 500KB |
| Structured Data | 5 | Has Schema.org markup |
| Canonical Tag | 5 | Has canonical URL |

**Total: 100 points**

## ⚖️ Legal & Ethical Notes

- ✅ Uses only public APIs and publicly accessible websites
- ✅ Respects rate limits
- ✅ Only collects business data (not personal data)
- ⚠️ Be mindful of website Terms of Service
- ⚠️ Don't run aggressive scans that could overload servers

## 🐛 Troubleshooting

### "Cannot connect to API server"
- Make sure `python server.py` is running
- Check that port 5000 is not in use

### "No companies found"
- The Brønnøysund API might be slow; try again
- Try a different municipality

### Slow scanning
- Use `--sequential` flag for gentler scanning
- Reduce `--max` number of companies

## 📜 License

MIT License - feel free to use and modify!
