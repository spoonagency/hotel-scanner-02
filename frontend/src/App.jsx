import React, { useState, useEffect } from 'react';
import { Search, Building2, TrendingUp, AlertTriangle, CheckCircle, Globe, MapPin, Users, Download, Loader2, ChevronDown, ChevronUp, ExternalLink, Filter, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const pinkAccent = '#FFC0CB';

// Score indicator component
const ScoreIndicator = ({ score, label, inverted = false }) => {
  const getColor = (s) => {
    if (inverted) {
      if (s >= 70) return '#10b981';
      if (s >= 40) return '#f59e0b';
      return '#ef4444';
    }
    if (s >= 70) return '#ef4444';
    if (s >= 40) return '#f59e0b';
    return '#10b981';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 transform -rotate-90">
          <circle cx="28" cy="28" r="24" stroke="#1e293b" strokeWidth="4" fill="none" />
          <circle
            cx="28" cy="28" r="24"
            stroke={getColor(score)}
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(score / 100) * 150.8} 150.8`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {score}
        </span>
      </div>
      <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
};

// Hotel card component
const HotelCard = ({ hotel, expanded, onToggle }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-pink-300/30 hover:shadow-lg hover:shadow-pink-300/10">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: pinkAccent }} />
              <h3 className="text-lg font-semibold text-white truncate">{hotel.name}</h3>
              {hotel.seo_accessible && (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" title="Website accessible" />
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin className="w-3 h-3" />
              <span>{hotel.municipality || 'N/A'}, {hotel.postal_place || 'Norway'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Org.nr: {hotel.org_number}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ScoreIndicator score={hotel.seo_score || 0} label="SEO" />
            <div className="flex flex-col items-center rounded-xl px-3 py-2" style={{ background: `linear-gradient(to bottom right, ${pinkAccent}, #f472b6)` }}>
              <span className="text-2xl font-black text-white">{hotel.opportunity_score || 0}</span>
              <span className="text-[9px] text-pink-100 uppercase tracking-wider">Opportunity</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-slate-500">Employees</p>
              <p className="text-sm font-medium text-white">{hotel.employees || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Website</p>
              {hotel.website ? (
                <a href={hotel.website} target="_blank" rel="noopener noreferrer" 
                   className="text-sm font-medium truncate block hover:text-pink-200 transition-colors" 
                   style={{ color: pinkAccent }}>
                  {hotel.website.replace(/^https?:\/\//, '').slice(0, 35)}...
                </a>
              ) : (
                <p className="text-sm text-slate-500">Not found</p>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm text-slate-400 hover:text-pink-300 transition-colors"
        >
          {expanded ? (
            <>Hide Details <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>View SEO Details <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      </div>
      
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-700/50 bg-slate-900/30">
          <div className="pt-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              SEO Issues Found ({hotel.seo_issues?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {hotel.seo_issues && hotel.seo_issues.length > 0 ? (
                hotel.seo_issues.map((issue, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400">
                    {issue}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No major issues detected</span>
              )}
            </div>
          </div>
          
          {hotel.seo_details && (
            <div className="pt-4 border-t border-slate-700/30">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">SEO Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">HTTPS</span>
                  <span className={hotel.seo_details.https ? 'text-emerald-400' : 'text-red-400'}>
                    {hotel.seo_details.https ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Viewport</span>
                  <span className={hotel.seo_details.mobile_viewport ? 'text-emerald-400' : 'text-red-400'}>
                    {hotel.seo_details.mobile_viewport ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">H1 Tags</span>
                  <span className="text-white">{hotel.seo_details.h1_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Images</span>
                  <span className="text-white">
                    {hotel.seo_details.images_without_alt || 0} / {hotel.seo_details.total_images || 0} missing alt
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Page Size</span>
                  <span className="text-white">{hotel.seo_details.page_size_kb || 'N/A'} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Structured Data</span>
                  <span className={hotel.seo_details.structured_data ? 'text-emerald-400' : 'text-red-400'}>
                    {hotel.seo_details.structured_data ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
              {hotel.seo_details.title && (
                <div className="mt-3">
                  <span className="text-slate-500 text-xs">Title Tag:</span>
                  <p className="text-white text-sm truncate">{hotel.seo_details.title}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/30">
            <div>
              <p className="text-xs text-slate-500 mb-1">Industry</p>
              <p className="text-sm text-white">{hotel.industry || 'Accommodation'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Address</p>
              <p className="text-sm text-white">{hotel.address || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
export default function NorwegianHotelSEOScanner() {
  const [municipalities, setMunicipalities] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [maxCompanies, setMaxCompanies] = useState(30);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [results, setResults] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [sortBy, setSortBy] = useState('opportunity_score');
  const [showFilters, setShowFilters] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState(null);

  // Check API connection on load
  useEffect(() => {
    checkApiConnection();
    fetchMunicipalities();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        setApiConnected(true);
        setError(null);
      }
    } catch (e) {
      setApiConnected(false);
      setError('Cannot connect to API server. Make sure the Python backend is running on port 5000.');
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const response = await fetch(`${API_BASE}/municipalities`);
      if (response.ok) {
        const data = await response.json();
        setMunicipalities(data);
      }
    } catch (e) {
      console.error('Failed to fetch municipalities:', e);
    }
  };

  const startScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setScanMessage('Starting scan...');
    setResults([]);
    setError(null);
    
    try {
      // Start the scan
      const startResponse = await fetch(`${API_BASE}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipality_code: selectedMunicipality || null,
          max_companies: maxCompanies
        })
      });
      
      if (!startResponse.ok) throw new Error('Failed to start scan');
      
      const { scan_id } = await startResponse.json();
      
      // Poll for status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`${API_BASE}/scan/${scan_id}/status`);
          const status = await statusResponse.json();
          
          setScanProgress(status.progress);
          setScanMessage(status.message);
          
          if (status.status === 'complete') {
            // Fetch results
            const resultsResponse = await fetch(`${API_BASE}/scan/${scan_id}/results`);
            const resultsData = await resultsResponse.json();
            setResults(resultsData.results);
            setIsScanning(false);
          } else if (status.status === 'error') {
            setError(status.message);
            setIsScanning(false);
          } else {
            // Continue polling
            setTimeout(pollStatus, 1000);
          }
        } catch (e) {
          setError('Lost connection to server');
          setIsScanning(false);
        }
      };
      
      pollStatus();
      
    } catch (e) {
      setError(e.message);
      setIsScanning(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'seo_score') {
      return (a.seo_score || 0) - (b.seo_score || 0); // Low to high for SEO
    }
    return (b[sortBy] || 0) - (a[sortBy] || 0);
  });

  const exportCSV = () => {
    const headers = ['Name', 'Org Number', 'Municipality', 'Address', 'Employees', 'Website', 'SEO Score', 'Opportunity Score', 'SEO Issues'];
    const rows = sortedResults.map(h => [
      h.name, h.org_number, h.municipality, h.address, h.employees, h.website, h.seo_score, h.opportunity_score, (h.seo_issues || []).join('; ')
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell || ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hotel_seo_scan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = results.length > 0 ? {
    total: results.length,
    withWebsite: results.filter(r => r.website).length,
    avgSeo: Math.round(results.filter(r => r.seo_accessible).reduce((acc, r) => acc + r.seo_score, 0) / results.filter(r => r.seo_accessible).length) || 0,
    avgOpportunity: Math.round(results.reduce((acc, r) => acc + r.opportunity_score, 0) / results.length) || 0,
  } : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 192, 203, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Aurora effect */}
      <div className="fixed top-0 left-0 right-0 h-96 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(255, 192, 203, 0.2)' }} />
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(244, 114, 182, 0.2)', animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6" 
               style={{ backgroundColor: 'rgba(255, 192, 203, 0.1)', border: '1px solid rgba(255, 192, 203, 0.2)', color: pinkAccent }}>
            <Building2 className="w-4 h-4" />
            <span>Norwegian Hotel Intelligence</span>
          </div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-pink-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Hotel SEO Scanner
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Real data from Brønnøysundregistrene • Live SEO analysis • Find your next clients
          </p>
        </header>

        {/* API Status */}
        <div className={`flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full text-sm mx-auto w-fit ${apiConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {apiConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {apiConnected ? 'API Connected' : 'API Disconnected'}
          {!apiConnected && (
            <button onClick={checkApiConnection} className="ml-2 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            {!apiConnected && (
              <p className="text-xs mt-2 text-red-300">
                Run `python server.py` in the backend folder to start the API server.
              </p>
            )}
          </div>
        )}

        {/* Scanner Controls */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">Municipality (optional)</label>
              <select
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-pink-300 transition-colors"
              >
                <option value="">All of Norway</option>
                {municipalities.map(m => (
                  <option key={m.code} value={m.code}>{m.name} ({m.region})</option>
                ))}
              </select>
            </div>
            
            <div className="w-40">
              <label className="block text-sm text-slate-400 mb-2">Max Companies</label>
              <input
                type="number"
                min="10"
                max="100"
                value={maxCompanies}
                onChange={(e) => setMaxCompanies(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-pink-300"
              />
            </div>
            
            <button
              onClick={startScan}
              disabled={!apiConnected || isScanning}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              style={{ background: `linear-gradient(to right, ${pinkAccent}, #f472b6)` }}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Scan
                </>
              )}
            </button>
          </div>
          
          {/* Progress Bar */}
          {isScanning && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{scanMessage}</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-300 to-pink-400 transition-all duration-500"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-slate-400">Companies Found</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: pinkAccent }}>{stats.withWebsite}</p>
              <p className="text-sm text-slate-400">With Websites</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{stats.avgSeo}</p>
              <p className="text-sm text-slate-400">Avg. SEO Score</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: pinkAccent }}>{stats.avgOpportunity}</p>
              <p className="text-sm text-slate-400">Avg. Opportunity</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">
                Found {results.length} Real Companies
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-300"
                >
                  <option value="opportunity_score">Sort by Opportunity</option>
                  <option value="seo_score">Sort by SEO Score (Low First)</option>
                  <option value="employees">Sort by Employees</option>
                </select>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-pink-300 hover:text-pink-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
            
            <div className="grid gap-4">
              {sortedResults.map((hotel) => (
                <HotelCard
                  key={hotel.org_number}
                  hotel={hotel}
                  expanded={expandedCard === hotel.org_number}
                  onToggle={() => setExpandedCard(expandedCard === hotel.org_number ? null : hotel.org_number)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isScanning && results.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Server className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-400 mb-2">Ready to Scan Real Data</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-4">
              This scanner fetches real company data from Brønnøysundregistrene and performs live SEO analysis on their websites.
            </p>
            {!apiConnected && (
              <div className="bg-slate-800/50 rounded-xl p-4 max-w-md mx-auto text-left">
                <p className="text-sm text-slate-400 mb-2">To start, run the backend server:</p>
                <code className="text-pink-300 text-sm">python server.py</code>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Real data from Brønnøysundregistrene API • Live website SEO analysis
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Official Norwegian Registry
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Real-time SEO Analysis
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Rate-limited requests
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
