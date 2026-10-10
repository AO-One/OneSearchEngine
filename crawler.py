import sqlite3
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

DB_NAME = "onesearch.db"

def init_crawler_db():
    """Ensures the SQLite FTS5 virtual table exists"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS pages USING fts5(
            url, 
            title, 
            content, 
            snippet
        )
    """)
    conn.commit()
    conn.close()

def crawl_website(start_url, max_pages=15):
    """Recursively crawls pages starting from a seed URL and stores them in onesearch.db"""
    init_crawler_db()
    visited = set()
    queue = [start_url]
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    print(f"==================================================")
    print(f" OneSearch Engine Crawler Starting...")
    print(f" Seed URL: {start_url}")
    print(f"==================================================")

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        
        print(f"[+] Crawling: {url}")
        try:
            headers = {'User-Agent': 'OneSearchCrawler/1.0 (+https://onesearchengine.local)'}
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code != 200:
                print(f"[-] Skipped (Status {response.status_code}): {url}")
                continue
            
            visited.add(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract page title and text content
            title = soup.title.string.strip() if soup.title else url
            paragraphs = [p.get_text() for p in soup.find_all('p')]
            content = " ".join(paragraphs)[:3000] # Limit content size
            snippet = content[:180] + "..." if len(content) > 180 else content

            # Save to local search database
            cursor.execute(
                "INSERT OR REPLACE INTO pages (url, title, content, snippet) VALUES (?, ?, ?, ?)",
                (url, title, content, snippet)
            )
            conn.commit()

            # Find and queue internal links (staying on the same domain)
            parsed_base = urlparse(url)
            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(url, link['href'])
                parsed_link = urlparse(absolute_url)
                
                # Only queue http/https links belonging to the same domain to keep crawler focused
                if parsed_link.scheme in ['http', 'https'] and parsed_link.netloc == parsed_base.netloc:
                    if absolute_url not in visited and absolute_url not in queue:
                        queue.append(absolute_url)

        except Exception as e:
            print(f"[-] Error crawling {url}: {e}")

    conn.close()
    print(f"==================================================")
    print(f" Crawl Complete! Successfully indexed {len(visited)} pages.")
    print(f" Data stored in {DB_NAME}")
    print(f"==================================================")

if __name__ == "__main__":
    # Example seed: You can pass any public website URL here
    seed_url = input("Enter starting seed URL to crawl (e.g., https://en.wikipedia.org/wiki/Python_(programming_language)): ").strip()
    if seed_url:
        crawl_website(seed_url, max_pages=15)