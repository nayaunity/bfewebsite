# BFE LinkedIn Sync

Unpacked Chrome extension for Referral Assist MVP.

## Load locally

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/linkedin-sync` folder

## Usage

1. Download `bfe-linkedin-sync-extension.zip` from the referrals page
2. Double-click the zip so it expands into an unzipped `linkedin-sync` folder
3. In Chrome, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select that `linkedin-sync` folder
4. In the web app, open `/profile/referrals`
5. Click **Generate extension token**, then copy the token
6. In LinkedIn, open a page with visible profile cards, like **My Network**, search results, or people results
7. Open the extension popup and confirm the App URL is `https://www.theblackfemaleengineer.com`
8. Paste the token into the extension popup
9. Click **Scan page**
10. Click **Sync captured**

The extension only captures visible profile cards on the current page. Repeat on more LinkedIn pages to refresh coverage.
