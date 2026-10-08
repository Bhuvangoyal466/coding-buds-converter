# Coding Buds — Code to Webpage

A single-page website for [Coding Buds](https://www.codingbuds.com) students that does two things:

1. **Converts pasted code into a complete HTML webpage** (with a live preview and a download button).
2. **Teaches students how to publish that page** on the internet with GitHub Pages, using a five-step "Web Wizard" tutorial and a progress checklist.

It is styled with the Coding Buds brand (navy and orange, League Spartan + Poppins) and deploys to Vercel with one serverless function.

---

## Features

- **Code-to-HTML converter**: choose a language, paste code, get a ready-to-use `index.html`.
- **Preview tab**: see the generated page in a sandboxed frame before copying it.
- **Copy and download**: one click to copy the HTML or download it as `index.html`.
- **Web Wizard tutorial**: five illustrated steps, from creating a GitHub account to going live on GitHub Pages.
- **Wizard checklist**: tick off each step; progress is remembered in the browser.
- **Course section and free-trial links** back to codingbuds.com.
- **Responsive layout** with a mobile menu, accessibility labels, and reduced-motion support.
- **Graceful image fallbacks**: missing screenshots show a dashed placeholder, and a missing logo is simply hidden.

## How it works

```
Browser (index.html)
   │  POST /api/convert  { code, language }
   ▼
Vercel serverless function (api/convert.js)
   │  sends a prompt + the code to the Groq API
   ▼
Groq (llama-3.3-70b-versatile) returns an HTML document
   │
   ▼
Browser shows the HTML, a preview, and copy / download buttons
```

The Groq API key lives only on the server as an environment variable and is never sent to the browser.

### Important: what "conversion" means

The converter does **not run** the student's code. A language model reads the code and writes a new HTML/JavaScript page that imitates what the program does. This means:

- Simple scripts, calculators, quizzes and basic tkinter-style apps usually convert well.
- Turtle drawings and pygame games are only approximated and may not match the original.
- Programs that depend on files, databases, networking or special libraries cannot work in the browser.
- Results can vary between runs, and very long programs may be cut off by the output limit.

Students should always preview the result and compare it with their original program.

## Tech stack

- Plain HTML, CSS and JavaScript (no framework, no build step)
- Vercel serverless function (Node.js 18+)
- [Groq API](https://console.groq.com) with the `llama-3.3-70b-versatile` model

## Project structure

```
coding-buds/
├── index.html            # The whole site: converter, tutorial, checklist, courses
├── api/
│   └── convert.js        # Serverless function that calls Groq
├── assets/
│   ├── logo.jpeg         # Coding Buds logo (navbar, footer, favicon)
│   └── screenshots/
│       ├── step-1-github-signup.png
│       ├── step-2-converter.png
│       ├── step-3-create-repo.png
│       ├── step-4-add-file.png
│       └── step-5-github-pages.png
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

`convert.js` **must** live inside a folder named `api`, or Vercel will not create the `/api/convert` route.

## Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- A free [Vercel](https://vercel.com) account
- A [Groq](https://console.groq.com) API key (**API Keys → Create API Key**; copy it right away, it is shown only once)
- (Optional) A GitHub account if you deploy through a repository

## Environment variables

| Name | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Your Groq API key. Without it, `/api/convert` returns "Server configuration error." |

Never commit your key. The included `.gitignore` should contain at least:

```
node_modules
.env*
```

## Run locally

Opening `index.html` directly, or using a static server such as VS Code Live Server, will **not** work: those servers cannot run the `/api/convert` function and the request fails with `405 Method Not Allowed`. Use the Vercel dev server instead.

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. In the project folder, create a file named `.env.local`:
   ```
   GROQ_API_KEY=your_key_here
   ```
3. Start the dev server and accept the defaults (log in if asked):
   ```bash
   vercel dev
   ```
4. Open `http://localhost:3000`.

### Test the API directly

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hi\")","language":"Python"}'
```

A successful response is JSON with an `html` field.

## Deploy to Vercel

### Option A: GitHub, then Vercel (recommended)

1. Create a new GitHub repository and push this project to it:
   ```bash
   git init
   git add .
   git commit -m "Coding Buds combined site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/coding-buds.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com), click **Add New → Project** and import the repository.
3. Set **Framework Preset** to **Other**. Leave Build Command, Output Directory and Install Command empty.
4. Under **Environment Variables**, add `GROQ_API_KEY` with your Groq key.
5. Click **Deploy**. You will get a URL like `https://coding-buds-xxxx.vercel.app`.

Every later push to `main` redeploys automatically.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel                                    # follow the prompts
vercel env add GROQ_API_KEY production    # paste your key
vercel --prod                             # deploy to production
```

### Changing the key after deploying

Environment variables only apply to **new** deployments. After adding or changing `GROQ_API_KEY`, go to **Deployments → ⋯ → Redeploy**.

## Test the live site

Open the production URL and check:

1. The logo, favicon and tutorial screenshots load.
2. Clicking **Convert** with an empty box shows "Please paste your code before converting."
3. Pasting `print("Hello, Coding Buds!")` and converting returns HTML within a few seconds.
4. The **Preview** tab renders the page and **Download index.html** saves a working file.
5. Ticking checklist items survives a page refresh.
6. The ☰ menu works when the window is narrow.

If something fails, open the browser DevTools (F12) → **Network**, click the `convert` request, and read the status and response.

## Customizing

- **Logo**: replace `assets/logo.jpeg`. If you use a different file name or format, update every `src="assets/logo.jpeg"` and the favicon `<link>` in `index.html`.
- **Screenshots**: add the five PNG files listed above. To use other names, change the `src` and `data-file` values on each `<figure class="shot">`.
- **Colors and fonts**: edit the CSS variables at the top of the `<style>` block in `index.html` (`--navy`, `--orange`, `--blue`, and so on).
- **Model or prompt**: edit `api/convert.js` (the `model` field and the `prompt` text).
- **Input size limit**: change `MAX_CODE_LENGTH` at the top of `api/convert.js` (default 20,000 characters).

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `405 Method Not Allowed` on `/api/convert` | You are using a static server (such as Live Server). Run `vercel dev`, or use the deployed URL. |
| "Server configuration error." | `GROQ_API_KEY` is missing or misspelled, or you did not redeploy after adding it. |
| `404` on `/api/convert` | `convert.js` is not inside a folder named `api`. |
| "Conversion failed. Please try again." | Groq rejected the request. Check **Vercel → Project → Logs**: `401` means a bad key, `429` means a rate limit. |
| Vercel login page when opening the URL | You opened a preview URL. Use the production domain shown on the project Overview page. |
| Images show a dashed box | The file is missing or the name does not match the `src` in `index.html`. |
| Favicon does not update | Hard-refresh with Ctrl+Shift+R; browsers cache favicons heavily. |

## Security notes

- The API route is public. Anyone who knows your site URL can call it, and every call uses your Groq quota. For a class or small audience this is usually fine; for wider use, add rate limiting and consider restricting `Access-Control-Allow-Origin` in `api/convert.js` from `*` to your own domain.
- Generated pages are shown in the Preview tab inside a sandboxed iframe (`sandbox="allow-scripts"`, no same-origin access), so they cannot read the site's own data.
- Treat generated HTML as untrusted until the student has reviewed it.

## Credits

Built for [Coding Buds](https://www.codingbuds.com), combining the original Code-to-Webpage converter and the Web Wizard publishing tutorial.

Add a `LICENSE` file if you plan to share or open-source this project.