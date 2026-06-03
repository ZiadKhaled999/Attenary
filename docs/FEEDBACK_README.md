# Feedback System

A serverless feedback collection system using Google Sheets as a backend database. This system allows users to submit feedback through a web form, with data automatically stored in Google Sheets via Google Apps Script.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Google Sheets Setup](#google-sheets-setup)
4. [Google Apps Script Deployment](#google-apps-script-deployment)
5. [Frontend Configuration](#frontend-configuration)
6. [Testing](#testing)
7. [Customization Options](#customization-options)
8. [Security Considerations](#security-considerations)
9. [FAQ](#faq)

---

## Overview

### Description

The Feedback System provides a lightweight, cost-effective solution for collecting user feedback without requiring a traditional backend server. It leverages Google's free infrastructure (Google Sheets and Apps Script) to create a fully functional feedback collection API.

### Features

- **📝 Multiple Feedback Types**: Support for bug reports, feature requests, general feedback, and other categories
- **✅ Dual Validation**: Both client-side and server-side validation ensure data integrity
- **🔒 Rate Limiting**: Built-in protection against spam and abuse (5 submissions per minute)
- **📊 Auto-organized Data**: Submissions are automatically organized in Google Sheets with status tracking
- **🌐 CORS Enabled**: Works with any web frontend, hosted anywhere
- **📱 Responsive Design**: Mobile-friendly form interface
- **♿ Accessible**: WCAG-compliant form with proper ARIA attributes
- **🚫 No Backend Required**: Completely serverless architecture

---

## Prerequisites

Before setting up the feedback system, ensure you have:

| Requirement | Description |
|-------------|-------------|
| **Google Account** | A Google account to create and manage Google Sheets and Apps Script |
| **Modern Web Browser** | Chrome, Firefox, Safari, or Edge (latest versions recommended) |
| **Basic Google Sheets Knowledge** | Familiarity with navigating Google Sheets |
| **Text Editor** | For modifying frontend files (VS Code, Sublime Text, etc.) |
| **Web Hosting** (optional) | For hosting the frontend files (GitHub Pages, Netlify, Vercel, or any static host) |

---

## Google Sheets Setup

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Click **Blank** to create a new spreadsheet
3. Rename the spreadsheet to something descriptive, e.g., "Feedback System Database"

### Step 2: Prepare the Sheet

**Important**: You do NOT need to manually create headers or columns. The Apps Script will automatically create the "Feedback Submissions" sheet with all required columns when it runs for the first time.

However, if you want to pre-configure the sheet:

1. Create a new sheet tab named exactly: `Feedback Submissions`
2. Add the following headers in row 1:

| Column | Header |
|--------|--------|
| A | ID |
| B | Timestamp |
| C | Feedback Type |
| D | Email |
| E | Content |
| F | User Agent |
| G | Referrer |
| H | Screen Resolution |
| I | Status |
| J | Notes |

3. Freeze the header row (View → Freeze → 1 row)

### Step 3: Note Your Spreadsheet ID

You'll need the Spreadsheet ID later. Find it in the URL:

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

The ID is the long string between `/d/` and `/edit`.

---

## Google Apps Script Deployment

### Step 1: Open Apps Script Editor

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. A new tab will open with the Apps Script editor

### Step 2: Copy the Backend Code

1. Delete any default code in the `Code.gs` file
2. Open the [`backend/Code.gs`](backend/Code.gs) file from this repository
3. Copy the entire contents
4. Paste it into the Apps Script editor

### Step 3: Save the Project

1. Click **File** → **Save** (or press Ctrl+S / Cmd+S)
2. Name your project, e.g., "Feedback System Backend"

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Type" and select **Web app**
3. Configure the deployment settings:

| Setting | Value | Reason |
|---------|-------|--------|
| **Description** | "Feedback API v1" | For your reference |
| **Execute as** | **Me** | The script runs under your account |
| **Who has access** | **Anyone** | Required for public form submissions |

4. Click **Deploy**

### Step 5: Authorize the Script

1. You'll see an authorization popup
2. Click **Authorize access**
3. Select your Google account
4. You may see a "Google hasn't verified this app" warning
   - Click **Advanced**
   - Click **Go to [Your Project Name] (unsafe)**
   - Click **Allow**

### Step 6: Get the Web App URL

After deployment, you'll see a URL like:

```
https://script.google.com/macros/s/ABC123def456GHI789jkl012/exec
```

**Copy this URL** - you'll need it for the frontend configuration.

### Important Deployment Notes

⚠️ **Execute as**: Always select "Me" so the script can access your Google Sheets

⚠️ **Who has access**: Select "Anyone" for public forms, or "Anyone with Google account" for restricted access

⚠️ **URL Structure**: The URL should end with `/exec` - this is the correct endpoint for your web app

---

## Frontend Configuration

### Step 1: Download Frontend Files

Download or clone these files from the `frontend/` directory:
- [`index.html`](frontend/index.html)
- [`styles.css`](frontend/styles.css)
- [`script.js`](frontend/script.js)

### Step 2: Update the API URL

Open [`script.js`](frontend/script.js:13) and locate the `CONFIG` object at the top:

```javascript
const CONFIG = {
    // API endpoint - Replace with your Google Apps Script web app URL
    API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    // ...
};
```

Replace `YOUR_SCRIPT_ID` with your actual script ID from the deployment URL:

```javascript
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/ABC123def456GHI789jkl012/exec',
    // ...
};
```

### Step 3: Customize the Form (Optional)

#### Change the Form Title

In [`index.html`](frontend/index.html:13), modify:

```html
<h1>Share Your Feedback</h1>
<p class="subtitle">We value your input and use it to improve our service</p>
```

#### Modify Colors

In [`styles.css`](frontend/styles.css), update the CSS custom properties:

```css
:root {
    --primary-color: #4285f4;    /* Main brand color */
    --primary-hover: #3367d6;    /* Hover state */
    --error-color: #ea4335;      /* Error messages */
    --success-color: #34a853;    /* Success messages */
}
```

### Step 4: Host the Frontend

You can host these files anywhere that serves static content:

| Platform | Instructions |
|----------|--------------|
| **GitHub Pages** | Push to a repo, enable Pages in Settings |
| **Netlify** | Drag and drop the folder, or connect to Git |
| **Vercel** | Import from Git or use CLI |
| **Local** | Open `index.html` directly in a browser |

---

## Testing

### Test the Form Locally

1. Open [`index.html`](frontend/index.html) in a web browser
2. Fill out the form:
   - Select a feedback type
   - Enter a valid email address
   - Write feedback content (minimum 10 characters)
3. Click **Submit Feedback**
4. You should see a success message

### Verify Data in Google Sheets

1. Open your Google Sheet
2. Navigate to the "Feedback Submissions" tab
3. You should see your test submission with:
   - Auto-generated ID
   - Timestamp
   - Feedback type
   - Email
   - Content
   - User agent information
   - Status set to "New"

### Test the API Directly

You can test the API endpoint using curl or Postman:

```bash
curl -X POST \
  'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec' \
  -H 'Content-Type: application/json' \
  -d '{
    "feedbackType": "bug_report",
    "email": "test@example.com",
    "content": "This is a test feedback submission.",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }'
```

### Troubleshooting Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| **"Network error" message** | Incorrect API URL | Verify the URL in `script.js` matches your deployment URL |
| **"Invalid JSON payload"** | Malformed request | Check browser console for errors |
| **Authorization error** | Script not authorized | Re-authorize in Apps Script editor |
| **Sheet not found** | Sheet name mismatch | Ensure sheet is named "Feedback Submissions" |
| **CORS error** | Wrong deployment settings | Redeploy with "Anyone" access |
| **Rate limit error** | Too many submissions | Wait 1 minute before submitting again |

### Debug Mode

Open the browser's Developer Tools (F12) and check the Console tab for detailed error messages. The Apps Script execution logs are available in the Apps Script editor under **Executions**.

---

## Customization Options

### Add or Remove Feedback Types

#### Frontend Changes

In [`index.html`](frontend/index.html:51-55), modify the select options:

```html
<select id="feedback-type" name="feedbackType" class="form-select" required>
    <option value="" disabled selected>Select a feedback type</option>
    <option value="bug_report">Bug Report</option>
    <option value="feature_request">Feature Request</option>
    <option value="general_feedback">General Feedback</option>
    <option value="other">Other</option>
    <!-- Add new types here -->
    <option value="complaint">Complaint</option>
    <option value="praise">Praise</option>
</select>
```

#### Backend Changes

In [`Code.gs`](backend/Code.gs:17-28), update the configuration:

```javascript
const CONFIG = {
  // ...
  VALID_FEEDBACK_TYPES: ['Bug Report', 'Feature Request', 'General Feedback', 'Other', 'Complaint', 'Praise'],
  
  VALID_FEEDBACK_TYPES_API: ['bug_report', 'feature_request', 'general_feedback', 'other', 'complaint', 'praise'],
  
  FEEDBACK_TYPE_MAP: {
    'bug_report': 'Bug Report',
    'feature_request': 'Feature Request',
    'general_feedback': 'General Feedback',
    'other': 'Other',
    'complaint': 'Complaint',
    'praise': 'Praise'
  },
  // ...
};
```

### Modify Validation Rules

#### Change Content Length Limits

In both [`script.js`](frontend/script.js:17-19) and [`Code.gs`](backend/Code.gs:31-32):

```javascript
// Frontend (script.js)
VALIDATION: {
    MIN_CONTENT_LENGTH: 20,    // Minimum characters (default: 10)
    MAX_CONTENT_LENGTH: 10000, // Maximum characters (default: 5000)
    // ...
}

// Backend (Code.gs)
MIN_CONTENT_LENGTH: 20,
MAX_CONTENT_LENGTH: 10000,
```

#### Change Email Length Limit

```javascript
// Frontend (script.js)
MAX_EMAIL_LENGTH: 320,  // Some systems allow longer emails

// Backend (Code.gs)
MAX_EMAIL_LENGTH: 320,
```

### Style the Form

The form uses CSS custom properties for easy theming. In [`styles.css`](frontend/styles.css):

```css
:root {
    /* Colors */
    --primary-color: #4285f4;
    --primary-hover: #3367d6;
    --error-color: #ea4335;
    --success-color: #34a853;
    
    /* Typography */
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-size-base: 16px;
    
    /* Spacing */
    --border-radius: 8px;
    --spacing-unit: 1rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Add Custom Fields

1. Add the HTML input in [`index.html`](frontend/index.html)
2. Update validation in [`script.js`](frontend/script.js)
3. Modify the payload construction in the `handleSubmit` function
4. Update [`Code.gs`](backend/Code.gs) to handle the new field
5. Add a new column in the Google Sheets structure

---

## Security Considerations

### Rate Limiting

The system implements rate limiting at two levels:

#### Client-Side Rate Limiting

```javascript
// In script.js
RATE_LIMIT: {
    MAX_SUBMISSIONS: 5,     // Maximum submissions allowed
    WINDOW_MS: 60000,       // Time window in milliseconds (1 minute)
    STORAGE_KEY: 'feedback_submissions'
}
```

- Uses `localStorage` to track submission timestamps
- Prevents accidental double-submissions
- Can be bypassed by clearing localStorage (not a security measure)

#### Server-Side Rate Limiting

```javascript
// In Code.gs
RATE_LIMIT: {
    MAX_SUBMISSIONS: 5,
    WINDOW_MS: 60000
}
```

- Uses Apps Script Properties Service
- Tracks submissions per client identifier
- Cannot be bypassed by client-side manipulation

### Data Privacy

| Consideration | Implementation |
|--------------|----------------|
| **Email Storage** | Emails are stored in lowercase for consistency |
| **Content Sanitization** | HTML tags are stripped, JavaScript protocols removed |
| **User Agent Collection** | Collected for debugging purposes only |
| **IP Address** | Not directly stored; used only for rate limiting |

### Best Practices

1. **Regular Data Review**: Periodically review submissions in Google Sheets
2. **Data Retention**: Establish a policy for how long to keep feedback data
3. **Access Control**: Limit who can view the Google Sheet
4. **Backup**: Regularly backup your Google Sheet data
5. **Monitoring**: Check the Error Log sheet for any issues

### Known Limitations

- **No Authentication**: The endpoint is publicly accessible
- **Quota Limits**: Google Apps Script has daily quotas (see [Quotas](https://developers.google.com/apps-script/guides/services/quotas))
- **No Encryption at Rest**: Google Sheets data is not end-to-end encrypted

---

## FAQ

### General Questions

**Q: Is this system free to use?**

A: Yes! Google Sheets and Apps Script are free for personal and small business use. Check Google's quota limits for high-volume usage.

**Q: Can I use this with my existing website?**

A: Yes. The frontend files can be integrated into any website. Just update the `API_URL` in `script.js`.

**Q: How many submissions can I handle?**

A: Google Apps Script allows approximately 20,000 URL fetches per day for free accounts. This should handle most feedback collection needs.

### Technical Questions

**Q: Why am I getting a CORS error?**

A: Ensure your Apps Script deployment is set to "Anyone" access, not "Anyone with Google account". The web app must be publicly accessible.

**Q: Can I add file upload support?**

A: Not directly. Google Apps Script web apps have limitations on file uploads. Consider using Google Forms for file attachments, or integrate with Google Drive API.

**Q: How do I add email notifications for new submissions?**

A: Add this function to `Code.gs`:

```javascript
function sendNotificationEmail(payload) {
  const recipient = 'your-email@example.com';
  const subject = `New Feedback: ${payload.feedbackType}`;
  const body = `
    New feedback received!
    
    Type: ${payload.feedbackType}
    Email: ${payload.email}
    Content: ${payload.content}
  `;
  
  MailApp.sendEmail(recipient, subject, body);
}
```

Then call it in the `doPost` function after storing the feedback.

**Q: Can I use this with a React/Vue/Angular app?**

A: Yes. Make a POST request to your Apps Script URL with the required payload structure. Remember to handle CORS properly.

**Q: How do I update the deployed script?**

A: 
1. Make changes in the Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon ✏️ to edit
4. Change the Version to "New version"
5. Click **Deploy**

The URL remains the same, so no frontend changes needed.

### Troubleshooting Questions

**Q: My submissions aren't appearing in the sheet.**

A: Check these items:
1. Verify the script is deployed correctly
2. Check the Apps Script **Executions** tab for errors
3. Ensure the sheet name matches exactly: "Feedback Submissions"
4. Try running the `testScript()` function manually in the editor

**Q: The form shows "Network error" but I have internet.**

A: 
1. Verify the `API_URL` is correct
2. Check if the deployment is set to "Anyone"
3. Try accessing the URL directly in your browser - you should see a JSON response

**Q: How do I reset the rate limit for testing?**

A: 
- **Client-side**: Clear your browser's localStorage
- **Server-side**: Wait 1 minute, or run this in Apps Script:

```javascript
function clearRateLimits() {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getProperties();
  for (const key in keys) {
    if (key.startsWith('rate_')) {
      props.deleteProperty(key);
    }
  }
}
```

---

## Support

For issues or questions:

1. Check the [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
2. Review the [Google Apps Script documentation](https://developers.google.com/apps-script)
3. Check the Apps Script execution logs for detailed error messages

---

## License

This feedback system is provided as-is for educational and practical use. Feel free to modify and adapt it to your needs.
