"""
Norwegian Hotel SEO Scanner
Fetches real company data from Brønnøysundregistrene and performs actual SEO analysis.
"""

import requests
import json
import time
import csv
import re
from datetime import datetime
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
warnings.filterwarnings('ignore')

class NorwegianHotelScanner:
    def __init__(self):
        self.brreg_base_url = "https://data.brreg.no/enhetsregisteret/api"
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
    
    def get_municipalities(self):
        """Return list of major Norwegian municipalities with their codes."""
        return [
            {'code': '0301', 'name': 'Oslo', 'region': 'Oslo'},
            {'code': '4601', 'name': 'Bergen', 'region': 'Vestland'},
            {'code': '5001', 'name': 'Trondheim', 'region': 'Trøndelag'},
            {'code': '1103', 'name': 'Stavanger', 'region': 'Rogaland'},
            {'code': '3005', 'name': 'Drammen', 'region': 'Viken'},
            {'code': '1201', 'name': 'Bergen', 'region': 'Vestland'},
            {'code': '1902', 'name': 'Tromsø', 'region': 'Troms og Finnmark'},
            {'code': '1001', 'name': 'Kristiansand', 'region': 'Agder'},
            {'code': '3024', 'name': 'Bærum', 'region': 'Viken'},
            {'code': '4204', 'name': 'Stord', 'region': 'Vestland'},
        ]
    
    def fetch_companies_from_brreg(self, municipality_code=None, industry_code='55'):
        """
        Fetch real companies from Brønnøysundregistrene API.
        Industry code 55 = Accommodation (hotels, camping, etc.)
        """
        print(f"\n🔍 Fetching companies from Brønnøysundregistrene...")
        
        companies = []
        page = 0
        page_size = 50
        
        while True:
            params = {
                'naeringskode': industry_code,  # 55 = Accommodation
                'size': page_size,
                'page': page,
                'konkurs': 'false',  # Exclude bankrupt companies
            }
            
            if municipality_code:
                params['kommunenummer'] = municipality_code
            
            try:
                response = self.session.get(
                    f"{self.brreg_base_url}/enheter",
                    params=params,
                    timeout=30
                )
                response.raise_for_status()
                data = response.json()
                
                embedded = data.get('_embedded', {})
                enheter = embedded.get('enheter', [])
                
                if not enheter:
                    break
                
                for company in enheter:
                    company_data = {
                        'org_number': company.get('organisasjonsnummer'),
                        'name': company.get('navn'),
                        'org_form': company.get('organisasjonsform', {}).get('beskrivelse'),
                        'industry': company.get('naeringskode1', {}).get('beskrivelse'),
                        'industry_code': company.get('naeringskode1', {}).get('kode'),
                        'municipality': company.get('forretningsadresse', {}).get('kommune'),
                        'postal_code': company.get('forretningsadresse', {}).get('postnummer'),
                        'postal_place': company.get('forretningsadresse', {}).get('poststed'),
                        'address': ', '.join(company.get('forretningsadresse', {}).get('adresse', [])),
                        'registered_date': company.get('registreringsdatoEnhetsregisteret'),
                        'employees': company.get('antallAnsatte', 0),
                        'website': company.get('hjemmeside'),
                    }
                    companies.append(company_data)
                
                print(f"   Retrieved page {page + 1}: {len(enheter)} companies (total: {len(companies)})")
                
                # Check if there are more pages
                page_info = data.get('page', {})
                total_pages = page_info.get('totalPages', 1)
                
                if page >= total_pages - 1 or page >= 9:  # Limit to 10 pages (500 companies max)
                    break
                
                page += 1
                time.sleep(0.5)  # Rate limiting - be nice to the API
                
            except requests.exceptions.RequestException as e:
                print(f"   ❌ Error fetching from Brønnøysund: {e}")
                break
        
        print(f"✅ Found {len(companies)} accommodation businesses")
        return companies
    
    def find_website(self, company):
        """Try to find company website if not in registry."""
        if company.get('website'):
            website = company['website']
            if not website.startswith('http'):
                website = 'https://' + website
            return website
        
        # Try common patterns based on company name
        name = company.get('name', '').lower()
        name_clean = re.sub(r'[^a-z0-9]', '', name)
        
        # Common Norwegian hotel website patterns
        potential_urls = [
            f"https://www.{name_clean}.no",
            f"https://{name_clean}.no",
        ]
        
        for url in potential_urls:
            try:
                response = self.session.head(url, timeout=5, allow_redirects=True)
                if response.status_code == 200:
                    return url
            except:
                continue
        
        return None
    
    def analyze_seo(self, url, company_name):
        """
        Perform real SEO analysis on a website.
        Returns SEO score and list of issues found.
        """
        seo_result = {
            'url': url,
            'score': 0,
            'issues': [],
            'details': {},
            'accessible': False
        }
        
        if not url:
            seo_result['issues'].append('No website found')
            return seo_result
        
        try:
            # Fetch the page
            response = self.session.get(url, timeout=15, allow_redirects=True)
            response.raise_for_status()
            seo_result['accessible'] = True
            seo_result['final_url'] = response.url
            
            soup = BeautifulSoup(response.content, 'html.parser')
            html = response.text.lower()
            
            score = 0
            max_score = 100
            
            # 1. Check HTTPS (10 points)
            if url.startswith('https://') or response.url.startswith('https://'):
                score += 10
                seo_result['details']['https'] = True
            else:
                seo_result['issues'].append('Not using HTTPS')
                seo_result['details']['https'] = False
            
            # 2. Check title tag (15 points)
            title_tag = soup.find('title')
            if title_tag and title_tag.string:
                title_text = title_tag.string.strip()
                seo_result['details']['title'] = title_text
                if len(title_text) >= 30 and len(title_text) <= 60:
                    score += 15
                elif len(title_text) > 0:
                    score += 8
                    if len(title_text) < 30:
                        seo_result['issues'].append(f'Title too short ({len(title_text)} chars, recommend 30-60)')
                    else:
                        seo_result['issues'].append(f'Title too long ({len(title_text)} chars, recommend 30-60)')
            else:
                seo_result['issues'].append('Missing title tag')
                seo_result['details']['title'] = None
            
            # 3. Check meta description (15 points)
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                desc_text = meta_desc['content'].strip()
                seo_result['details']['meta_description'] = desc_text[:100] + '...' if len(desc_text) > 100 else desc_text
                if len(desc_text) >= 120 and len(desc_text) <= 160:
                    score += 15
                elif len(desc_text) > 0:
                    score += 8
                    if len(desc_text) < 120:
                        seo_result['issues'].append(f'Meta description too short ({len(desc_text)} chars)')
                    else:
                        seo_result['issues'].append(f'Meta description too long ({len(desc_text)} chars)')
            else:
                seo_result['issues'].append('Missing meta description')
                seo_result['details']['meta_description'] = None
            
            # 4. Check H1 tag (15 points)
            h1_tags = soup.find_all('h1')
            seo_result['details']['h1_count'] = len(h1_tags)
            if len(h1_tags) == 1:
                score += 15
                seo_result['details']['h1_text'] = h1_tags[0].get_text()[:50]
            elif len(h1_tags) > 1:
                score += 8
                seo_result['issues'].append(f'Multiple H1 tags found ({len(h1_tags)})')
            else:
                seo_result['issues'].append('Missing H1 tag')
            
            # 5. Check images alt tags (10 points)
            images = soup.find_all('img')
            images_without_alt = [img for img in images if not img.get('alt')]
            seo_result['details']['total_images'] = len(images)
            seo_result['details']['images_without_alt'] = len(images_without_alt)
            
            if len(images) > 0:
                alt_ratio = (len(images) - len(images_without_alt)) / len(images)
                score += int(10 * alt_ratio)
                if len(images_without_alt) > 0:
                    seo_result['issues'].append(f'{len(images_without_alt)} of {len(images)} images missing alt text')
            else:
                score += 5  # No images isn't necessarily bad
            
            # 6. Check viewport meta (mobile-friendly indicator) (10 points)
            viewport = soup.find('meta', attrs={'name': 'viewport'})
            if viewport:
                score += 10
                seo_result['details']['mobile_viewport'] = True
            else:
                seo_result['issues'].append('Missing viewport meta tag (not mobile-friendly)')
                seo_result['details']['mobile_viewport'] = False
            
            # 7. Check for Open Graph tags (5 points)
            og_tags = soup.find_all('meta', property=re.compile(r'^og:'))
            seo_result['details']['og_tags_count'] = len(og_tags)
            if len(og_tags) >= 3:
                score += 5
            elif len(og_tags) > 0:
                score += 2
            else:
                seo_result['issues'].append('Missing Open Graph tags')
            
            # 8. Check page load size (10 points)
            page_size_kb = len(response.content) / 1024
            seo_result['details']['page_size_kb'] = round(page_size_kb, 1)
            if page_size_kb < 500:
                score += 10
            elif page_size_kb < 1000:
                score += 5
            else:
                seo_result['issues'].append(f'Large page size ({round(page_size_kb)}KB)')
            
            # 9. Check for structured data (5 points)
            has_schema = 'application/ld+json' in html or 'itemtype' in html
            seo_result['details']['structured_data'] = has_schema
            if has_schema:
                score += 5
            else:
                seo_result['issues'].append('Missing structured data (Schema.org)')
            
            # 10. Check for canonical tag (5 points)
            canonical = soup.find('link', rel='canonical')
            if canonical:
                score += 5
                seo_result['details']['canonical'] = True
            else:
                seo_result['issues'].append('Missing canonical tag')
                seo_result['details']['canonical'] = False
            
            seo_result['score'] = min(score, max_score)
            
        except requests.exceptions.Timeout:
            seo_result['issues'].append('Website timeout (>15s)')
        except requests.exceptions.SSLError:
            seo_result['issues'].append('SSL certificate error')
        except requests.exceptions.ConnectionError:
            seo_result['issues'].append('Could not connect to website')
        except Exception as e:
            seo_result['issues'].append(f'Error analyzing website: {str(e)[:50]}')
        
        return seo_result
    
    def analyze_company(self, company):
        """Analyze a single company: find website and perform SEO analysis."""
        print(f"   Analyzing: {company['name'][:40]}...")
        
        # Find website
        website = self.find_website(company)
        company['website'] = website
        
        # Perform SEO analysis
        seo_result = self.analyze_seo(website, company['name'])
        
        # Calculate opportunity score
        # Higher score = better opportunity (good company with bad SEO)
        seo_weakness = 100 - seo_result['score']  # Inverted: lower SEO = higher opportunity
        company_strength = min(100, (company.get('employees', 0) or 0) * 5)  # More employees = likely larger business
        
        opportunity_score = int((seo_weakness * 0.6) + (company_strength * 0.4))
        
        return {
            **company,
            'website': website,
            'seo_score': seo_result['score'],
            'seo_issues': seo_result['issues'],
            'seo_details': seo_result['details'],
            'seo_accessible': seo_result['accessible'],
            'opportunity_score': opportunity_score
        }
    
    def scan(self, municipality_code=None, max_companies=50, parallel=True):
        """
        Main scanning function.
        
        Args:
            municipality_code: Optional municipality code to filter by
            max_companies: Maximum number of companies to analyze
            parallel: Whether to analyze companies in parallel
        """
        print("\n" + "="*60)
        print("🏨 NORWEGIAN HOTEL SEO SCANNER")
        print("="*60)
        
        # Fetch companies from Brønnøysund
        companies = self.fetch_companies_from_brreg(municipality_code)
        
        if not companies:
            print("❌ No companies found")
            return []
        
        # Limit the number of companies to analyze
        companies_to_analyze = companies[:max_companies]
        print(f"\n🔍 Analyzing SEO for {len(companies_to_analyze)} companies...")
        
        self.results = []
        
        if parallel:
            # Parallel analysis (faster but more aggressive)
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(self.analyze_company, c): c for c in companies_to_analyze}
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        self.results.append(result)
                    except Exception as e:
                        print(f"   ❌ Error: {e}")
        else:
            # Sequential analysis (slower but gentler on servers)
            for company in companies_to_analyze:
                try:
                    result = self.analyze_company(company)
                    self.results.append(result)
                    time.sleep(1)  # Be nice to websites
                except Exception as e:
                    print(f"   ❌ Error analyzing {company['name']}: {e}")
        
        # Sort by opportunity score (highest first)
        self.results.sort(key=lambda x: x['opportunity_score'], reverse=True)
        
        print(f"\n✅ Analysis complete! {len(self.results)} companies analyzed.")
        return self.results
    
    def export_csv(self, filename=None):
        """Export results to CSV file."""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'hotel_seo_scan_{timestamp}.csv'
        
        if not self.results:
            print("❌ No results to export")
            return
        
        fieldnames = [
            'name', 'org_number', 'municipality', 'address', 'postal_code', 'postal_place',
            'employees', 'website', 'seo_score', 'opportunity_score', 'seo_issues',
            'industry', 'registered_date'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            for result in self.results:
                row = {**result}
                row['seo_issues'] = '; '.join(result.get('seo_issues', []))
                writer.writerow(row)
        
        print(f"📁 Results exported to: {filename}")
        return filename
    
    def export_json(self, filename=None):
        """Export results to JSON file."""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'hotel_seo_scan_{timestamp}.json'
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"📁 Results exported to: {filename}")
        return filename
    
    def print_summary(self, top_n=10):
        """Print a summary of top opportunities."""
        if not self.results:
            print("No results to display")
            return
        
        print("\n" + "="*60)
        print(f"🏆 TOP {top_n} OPPORTUNITIES")
        print("="*60)
        
        for i, company in enumerate(self.results[:top_n], 1):
            print(f"\n{i}. {company['name']}")
            print(f"   📍 {company.get('municipality', 'N/A')}, {company.get('postal_place', 'N/A')}")
            print(f"   🔢 Org.nr: {company['org_number']}")
            print(f"   👥 Employees: {company.get('employees', 'N/A')}")
            print(f"   🌐 Website: {company.get('website', 'Not found')}")
            print(f"   📊 SEO Score: {company['seo_score']}/100")
            print(f"   🎯 Opportunity Score: {company['opportunity_score']}/100")
            
            if company.get('seo_issues'):
                print(f"   ⚠️  Issues: {', '.join(company['seo_issues'][:3])}")
        
        # Statistics
        print("\n" + "="*60)
        print("📈 STATISTICS")
        print("="*60)
        
        accessible = [r for r in self.results if r.get('seo_accessible')]
        avg_seo = sum(r['seo_score'] for r in accessible) / len(accessible) if accessible else 0
        
        print(f"Total companies analyzed: {len(self.results)}")
        print(f"Companies with accessible websites: {len(accessible)}")
        print(f"Average SEO score: {avg_seo:.1f}/100")
        print(f"Companies with SEO score < 50: {len([r for r in self.results if r['seo_score'] < 50])}")


def main():
    """Main entry point for command line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Norwegian Hotel SEO Scanner')
    parser.add_argument('--municipality', '-m', help='Municipality code (e.g., 0301 for Oslo)')
    parser.add_argument('--max', '-n', type=int, default=30, help='Maximum companies to analyze')
    parser.add_argument('--output', '-o', help='Output filename (without extension)')
    parser.add_argument('--format', '-f', choices=['csv', 'json', 'both'], default='both', help='Output format')
    parser.add_argument('--sequential', '-s', action='store_true', help='Sequential mode (slower but gentler)')
    
    args = parser.parse_args()
    
    scanner = NorwegianHotelScanner()
    
    # Show available municipalities
    if not args.municipality:
        print("\nAvailable municipalities:")
        for m in scanner.get_municipalities():
            print(f"  {m['code']}: {m['name']} ({m['region']})")
        print("\nUse --municipality CODE or -m CODE to filter by municipality")
        print("Or run without filter to scan all of Norway\n")
    
    # Run the scan
    results = scanner.scan(
        municipality_code=args.municipality,
        max_companies=args.max,
        parallel=not args.sequential
    )
    
    if results:
        # Print summary
        scanner.print_summary()
        
        # Export results
        base_filename = args.output or f"hotel_scan_{args.municipality or 'norway'}"
        
        if args.format in ['csv', 'both']:
            scanner.export_csv(f"{base_filename}.csv")
        
        if args.format in ['json', 'both']:
            scanner.export_json(f"{base_filename}.json")


if __name__ == '__main__':
    main()
