# ShopShield AI

Build a modern full-stack web application called “ShopShield AI” based on the Vercel template style.

PROJECT TITLE:

AI-Powered Browser Extension for Detecting Fake Shopping Websites

OBJECTIVE:

Create a professional web platform that works as the companion dashboard for an AI-powered browser extension that detects fake, fraudulent, and suspicious shopping websites. The platform must include secure login authentication, a user dashboard, website URL scanning, risk analysis, scan history, and security recommendations.

TECH STACK:

- Next.js / React

- TypeScript

- Tailwind CSS

- Modern Vercel-style UI

- Supabase for authentication and database

- Responsive design for desktop, tablet, and mobile

- Use clean reusable components

- Use API routes/server actions where appropriate

AUTHENTICATION:

Create a complete authentication system:

- Sign Up

- Login

- Logout

- Forgot Password

- Reset Password

- Protected dashboard routes

- Email/password authentication

- User profile

- Session persistence

- Show validation and error messages

- Redirect unauthenticated users to the login page

LANDING PAGE:

Create an attractive cybersecurity/AI landing page with:

- Navbar with logo “ShopShield AI”

- Home

- Features

- How It Works

- Security

- Login

- Get Started button

- Hero section:

  “Detect Fake Shopping Websites Before You Buy”

- Subtitle explaining that ShopShield AI uses AI-based website analysis to identify suspicious shopping websites.

- CTA buttons: “Scan a Website” and “Get Started”

- AI/cybersecurity themed visual

- Feature cards

- How-it-works section

- Statistics section

- FAQ section

- Footer

DASHBOARD:

After login, show a professional security dashboard containing:

1. Overview

- Total websites scanned

- Safe websites

- Suspicious websites

- High-risk websites

- Recent scan activity

2. WEBSITE SCANNER

Create a prominent URL input:

“Enter shopping website URL”

Example:

https://example-shopping-site.com

Button:

“Scan Website”

When scanned, display an AI risk-analysis result containing:

- Overall Risk Score: 0–100

- Classification:

  SAFE / SUSPICIOUS / HIGH RISK

- Trust Score

- Domain Age

- HTTPS/SSL status

- URL structure analysis

- Suspicious keywords

- Domain reputation

- Website security indicators

- Payment security indicators

- Contact information availability

- Privacy policy availability

- Return/refund policy availability

- Suspicious redirects

- AI-generated explanation

Use a clear visual risk indicator such as:

Green = Safe

Yellow/Orange = Suspicious

Red = High Risk

IMPORTANT:

For the prototype, use realistic mock AI analysis data if a real ML model/API is not connected yet. Structure the code so a real AI/ML API can be connected later.

3. SCAN HISTORY

Create a table showing:

- Website

- URL

- Scan date

- Risk score

- Status

- View Details button

Allow users to search/filter scan history.

4. RESULT DETAILS PAGE

When the user clicks “View Details”, display:

- Website information

- Risk score

- Risk classification

- Detected threats

- Positive security indicators

- Warning indicators

- AI explanation

- Recommended action

Example recommendation:

“Do not enter card details or personal information on this website.”

5. USER PROFILE

Create a profile page containing:

- Name

- Email

- Account creation date

- Profile settings

- Change password

- Logout

6. DASHBOARD SIDEBAR:

Include:

- Dashboard

- Scan Website

- Scan History

- Security Reports

- Profile

- Settings

- Logout

BROWSER EXTENSION SECTION:

Add a page explaining the companion browser extension.

Show:

“ShopShield AI Browser Extension”

Explain that the extension can automatically analyze shopping websites while users browse.

Show a mock browser-extension interface containing:

- Current website URL

- Risk Score

- Website Status

- Security warnings

- “View Full Report” button

Add:

“Download Extension”

button, but make it a placeholder for now.

AI DETECTION LOGIC:

Design the system around multiple website-risk indicators:

- URL length

- Number of special characters

- Suspicious keywords

- HTTPS availability

- Domain age

- Domain reputation

- SSL certificate information

- Redirect behavior

- Missing contact information

- Missing privacy policy

- Missing refund policy

- Suspicious payment methods

- Abnormally low product prices

- Brand impersonation indicators

Create a mock AI scoring function that combines these features into a risk score.

DATABASE:

Create Supabase database structure for:

users

website_scans

risk_indicators

scan_history

Each scan should be associated with the authenticated user.

SECURITY:

- Use Supabase authentication

- Protect dashboard routes

- Users should only be able to access their own scan history

- Never expose secret API keys in frontend code

- Validate submitted URLs

- Sanitize user input

UI/UX:

Use a premium modern cybersecurity SaaS design inspired by Vercel:

- Clean layout

- Dark/light mode

- Professional typography

- Rounded cards

- Subtle borders

- Soft gradients

- Minimal animations

- Responsive design

- Accessible components

- Loading states

- Empty states

- Error states

- Toast notifications

COLOR DIRECTION:

Use a professional cybersecurity palette:

- Dark navy/black

- White

- Blue

- Green for safe

- Orange for suspicious

- Red for dangerous

IMPORTANT PAGES:

/

 /login

 /signup

 /forgot-password

 /dashboard

 /dashboard/scan

 /dashboard/history

 /dashboard/report/[id]

 /dashboard/profile

 /dashboard/settings

 /extension

FINAL REQUIREMENTS:

- Make the application look production-ready.

- Do not create a simple static landing page.

- Authentication and dashboard navigation must work.

- Use mock scan/AI data where backend AI integration is unavailable.

- Make the architecture ready for future integration with a Python/FastAPI machine-learning backend.

- Create realistic sample scan results for demonstration.

- Ensure the entire application is responsive.

- Use reusable React components.

- Provide clear setup instructions for Supabase environment variables.

- Make the UI suitable for a college major/minor project demonstration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5794eec0-2c75-48f2-8408-edeb41bcee88).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
