"""
Flask API server for the Norwegian Hotel SEO Scanner.
Provides REST endpoints for the frontend to consume.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from scanner import NorwegianHotelScanner
import threading
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Store scan results and status
scans = {}
scanner = NorwegianHotelScanner()


@app.route('/api/municipalities', methods=['GET'])
def get_municipalities():
    """Return list of available municipalities."""
    return jsonify(scanner.get_municipalities())


@app.route('/api/scan/start', methods=['POST'])
def start_scan():
    """Start a new scan."""
    data = request.json or {}
    municipality_code = data.get('municipality_code')
    max_companies = data.get('max_companies', 30)
    
    scan_id = str(uuid.uuid4())
    scans[scan_id] = {
        'status': 'running',
        'progress': 0,
        'message': 'Starting scan...',
        'results': []
    }
    
    def run_scan():
        try:
            scans[scan_id]['message'] = 'Fetching companies from Brønnøysundregistrene...'
            scans[scan_id]['progress'] = 10
            
            companies = scanner.fetch_companies_from_brreg(municipality_code)
            
            scans[scan_id]['message'] = f'Found {len(companies)} companies. Analyzing SEO...'
            scans[scan_id]['progress'] = 30
            
            companies_to_analyze = companies[:max_companies]
            results = []
            
            for i, company in enumerate(companies_to_analyze):
                try:
                    result = scanner.analyze_company(company)
                    results.append(result)
                    
                    progress = 30 + int((i + 1) / len(companies_to_analyze) * 60)
                    scans[scan_id]['progress'] = progress
                    scans[scan_id]['message'] = f'Analyzed {i + 1}/{len(companies_to_analyze)}: {company["name"][:30]}...'
                except Exception as e:
                    print(f"Error analyzing {company.get('name')}: {e}")
            
            # Sort by opportunity score
            results.sort(key=lambda x: x.get('opportunity_score', 0), reverse=True)
            
            scans[scan_id]['status'] = 'complete'
            scans[scan_id]['progress'] = 100
            scans[scan_id]['message'] = 'Scan complete!'
            scans[scan_id]['results'] = results
            
        except Exception as e:
            scans[scan_id]['status'] = 'error'
            scans[scan_id]['message'] = str(e)
    
    thread = threading.Thread(target=run_scan)
    thread.start()
    
    return jsonify({'scan_id': scan_id})


@app.route('/api/scan/<scan_id>/status', methods=['GET'])
def get_scan_status(scan_id):
    """Get the status of a scan."""
    if scan_id not in scans:
        return jsonify({'error': 'Scan not found'}), 404
    
    scan = scans[scan_id]
    return jsonify({
        'status': scan['status'],
        'progress': scan['progress'],
        'message': scan['message'],
        'result_count': len(scan.get('results', []))
    })


@app.route('/api/scan/<scan_id>/results', methods=['GET'])
def get_scan_results(scan_id):
    """Get the results of a completed scan."""
    if scan_id not in scans:
        return jsonify({'error': 'Scan not found'}), 404
    
    scan = scans[scan_id]
    
    # Clean results for JSON serialization
    results = []
    for r in scan.get('results', []):
        clean_result = {
            'id': r.get('org_number'),
            'name': r.get('name'),
            'org_number': r.get('org_number'),
            'municipality': r.get('municipality'),
            'postal_place': r.get('postal_place'),
            'address': r.get('address'),
            'employees': r.get('employees', 0),
            'website': r.get('website'),
            'industry': r.get('industry'),
            'seo_score': r.get('seo_score', 0),
            'seo_issues': r.get('seo_issues', []),
            'seo_details': r.get('seo_details', {}),
            'seo_accessible': r.get('seo_accessible', False),
            'opportunity_score': r.get('opportunity_score', 0),
            'registered_date': r.get('registered_date'),
        }
        results.append(clean_result)
    
    return jsonify({
        'status': scan['status'],
        'results': results
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print("\n🚀 Starting Norwegian Hotel SEO Scanner API...")
    print(f"   API running at: http://localhost:{port}")
    print("   Frontend at: http://localhost:5173 (run 'npm run dev' in frontend folder)\n")
    app.run(host='0.0.0.0', port=port, debug=debug)
