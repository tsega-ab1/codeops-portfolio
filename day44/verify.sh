#!/usr/bin/env bash
# Run while `npm run dev` (or `npm start`) is running on port 3044.
B=http://localhost:3044
check() { printf '\n== %s ==\n' "$1"; }

check "Home title";            curl -s $B/ | grep -o '<title>[^<]*</title>'
check "Menu title";            curl -s $B/menu | grep -o '<title>[^<]*</title>'
check "Kitfo title";           curl -s $B/menu/kitfo | grep -o '<title>[^<]*</title>'
check "Kitfo description";     curl -s $B/menu/kitfo | grep -o '<meta name="description"[^>]*>'
check "Kitfo canonical";       curl -s $B/menu/kitfo | grep -o '<link rel="canonical"[^>]*>'
check "Kitfo og tags";         curl -s $B/menu/kitfo | grep -o '<meta property="og:[^>]*>'
check "Kitfo JSON-LD";         curl -s $B/menu/kitfo | grep -o '<script type="application/ld+json">[^<]*</script>'
check "Cart noindex";          curl -s $B/cart | grep -o '<meta name="robots"[^>]*>'
check "sitemap.xml";           curl -s $B/sitemap.xml
check "robots.txt";            curl -s $B/robots.txt
check "Kitfo OG image status"; curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $B/menu/kitfo/opengraph-image
check "Unknown dish status";   curl -s -o /dev/null -w '%{http_code}\n' $B/menu/pizza
