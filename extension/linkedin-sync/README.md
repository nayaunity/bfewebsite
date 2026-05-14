# BFE LinkedIn Sync

Unpacked Chrome extension for Referral Assist MVP.

## Load locally

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/linkedin-sync` folder

## Usage

1. In the web app, open `/profile/referrals`
2. Click **Generate extension token**, then copy the token
3. In LinkedIn, open a page with visible profile cards, like **My Network**, search results, or people results
4. Open the extension popup and confirm the App URL is `https://www.theblackfemaleengineer.com`
5. Paste the token into the extension popup
6. Click **Scan page**
7. Click **Sync captured**

The extension only captures visible profile cards on the current page. Repeat on more LinkedIn pages to refresh coverage.
