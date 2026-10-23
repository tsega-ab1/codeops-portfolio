#!/usr/bin/env bash
B=http://localhost:3045
t() { printf '\n== %s ==\n' "$1"; }

t "Home title";         curl -s $B/ | grep -o '<title>[^<]*</title>'
t "Menu title";         curl -s $B/menu | grep -o '<title>[^<]*</title>'
t "Kitfo title";        curl -s $B/menu/kitfo | grep -o '<title>[^<]*</title>'
t "Kitfo canonical";    curl -s $B/menu/kitfo | grep -o '<link rel="canonical"[^>]*>'
t "Kitfo og:image";     curl -s $B/menu/kitfo | grep -o '<meta property="og:image"[^>]*>'
t "Kitfo JSON-LD";      curl -s $B/menu/kitfo | grep -o '<script type="application/ld+json">[^<]*</script>'
t "Menu is server-rendered (dish names in HTML)"; curl -s $B/menu | grep -o 'Kitfo\|Doro Wat\|Tibs' | sort -u
t "Signin noindex";     curl -s $B/signin | grep -o '<meta name="robots"[^>]*>'
t "sitemap.xml";        curl -s $B/sitemap.xml | grep -o '<loc>[^<]*</loc>'
t "robots.txt";         curl -s $B/robots.txt
t "Unknown dish";       curl -s -o /dev/null -w '%{http_code}\n' $B/menu/pizza
