# Rashida Qaiyumi — portfolio site

Static site — plain HTML, CSS, and JavaScript. No build step, no bundler, no framework. GSAP + ScrollTrigger (scroll reveals) and Lenis (smooth inertia scroll) are loaded from CDN directly in `index.html`.

## What's in this folder

```
index.html      All page content and structure
styles.css      All styling (theme colors/fonts are CSS custom properties at the top of the file)
script.js       Nav behavior, scroll reveals, custom cursor, sticky-note stack, load animation, etc.
package.json    Optional convenience script only — see "Local development" below
.gitignore      Excludes node_modules/, OS files, editor files, env files
assets/
  rashida-photo.jpg          Hero photo (casual)
  rashida-professional.jpg   About section photo (professional headshot)
  Rashida_Qaiyumi_Resume.pdf Downloadable resume (linked from the hero)
```

There is no `package-lock.json` — `package.json` has zero real dependencies (the one convenience script uses `npx`, which fetches on demand rather than being installed), so there's nothing to lock.

## Requirements

None, strictly speaking — you can open `index.html` directly in a browser. If you want the `npm run dev` convenience script (recommended, avoids some browser `file://` restrictions with fonts/scripts), you'll need Node.js installed — any reasonably recent version (18+) works fine, since nothing here actually compiles or transpiles anything.

## Local development

Any of these work:

```bash
# Option A — npm convenience script
npm install      # installs nothing real, just registers the script
npm run dev      # serves the site at http://localhost:3000

# Option B — VS Code
# Install the "Live Server" extension, right-click index.html → "Open with Live Server"

# Option C — Python (if you have it and don't want Node at all)
python3 -m http.server 8000
# then visit http://localhost:8000

# Option D — just open the file
open index.html   # macOS
start index.html  # Windows
```

## Production build

There isn't one — `npm run build` just prints a reminder that nothing needs building. The three files (`index.html`, `styles.css`, `script.js`) plus `assets/` *are* the production site.

## Deploying

### Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: **New Project → Import** your repo.
3. Framework Preset: choose **"Other"** (not a framework Vercel needs to build — it's static).
4. Leave Build Command empty and Output Directory as the repo root.
5. Deploy. Vercel serves `index.html` and its assets directly.

### GitHub Pages
1. Push this folder to a repo.
2. **Settings → Pages → Source** → pick the branch/folder containing `index.html`.
3. You'll get a URL like `https://<username>.github.io/<repo-name>/`. All asset paths in this project are relative (`assets/...`), so it works correctly whether deployed at a root domain or a subpath.

## Notes for whoever picks this up next
- `assets/rashida-photo.jpg` is 734×456 at screen resolution — reads fine at current sizes, would look soft blown up much larger. Swap in a higher-res original if one becomes available.
- The Blog section cards use gradient placeholder covers, not real Hashnode post cover images — flagged in the code with a comment (`.blog-card::before`) if real covers get added later.
- This was built as vanilla HTML/CSS/JS rather than the React/Vite/TypeScript stack from the original spec. It's functionally equivalent (same GSAP/Lenis behavior, same design system) but not the same codebase as your other repos. If you want a React/TS port for stack parity, that's a separate task.
