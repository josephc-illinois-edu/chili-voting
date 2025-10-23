# Google Forms Integration Guide

This guide shows you how to integrate your existing Google Form with the Chili Voting System so submissions automatically create entries in the database.

## 🏗️ Architecture

```
Google Form → Apps Script → API Route → Supabase Database → Admin Dashboard
```

## 📋 Prerequisites

1. Your existing Google Form: https://docs.google.com/forms/d/e/1FAIpQLSdSGQHHQrAK7uqgJx9lyjFERVlQyWBcyzGVv-z4GebSCp_Qpw/viewform
2. Deployed Next.js application (Vercel or other)
3. Access to your `.env.local` file

---

## 🔧 Setup Steps

### **Step 1: Generate API Key**

Generate a secure API key for authentication:

```bash
# On macOS/Linux/Git Bash
openssl rand -base64 32

# Or use this online: https://generate-random.org/api-key-generator
```

Copy the generated key and add it to your `.env.local` file:

```env
GOOGLE_FORMS_API_KEY=your-generated-key-here
```

**Important:** Also add this to your Vercel environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `GOOGLE_FORMS_API_KEY` = `your-generated-key`
3. Redeploy your app

---

### **Step 2: Configure Google Form Field Names**

Your Google Form needs these fields. Edit your form to include:

| **Form Question** | **Field Type** | **Required** | **Apps Script Variable** |
|-------------------|----------------|--------------|--------------------------|
| Chili Name | Short answer | Yes | `name` |
| Contestant Name | Short answer | Yes | `contestantName` |
| Recipe/Preparation | Paragraph | No | `recipe` |
| Ingredients (comma-separated) | Paragraph | No | `ingredients` |
| Allergens (comma-separated) | Short answer | No | `allergens` |
| Spice Level (1-5) | Linear scale (1-5) | No | `spiceLevel` |
| Description | Paragraph | No | `description` |

**Example Questions:**
- ✅ "What is the name of your chili?"
- ✅ "What is your name (contestant)?"
- ✅ "Recipe or preparation method (optional)"
- ✅ "List ingredients, separated by commas (optional)"
- ✅ "List any allergens, separated by commas (optional)"
- ✅ "Spice level from 1 (mild) to 5 (very hot)"
- ✅ "Brief description of your chili (optional)"

---

### **Step 3: Add Google Apps Script**

1. **Open your Google Form**
2. Click the **three dots menu (⋮)** → **Script editor**
3. Delete any existing code
4. **Paste the following script:**

```javascript
/**
 * Google Apps Script - Chili Form Submission Handler
 * Sends form submissions to Next.js API
 */

// CONFIGURATION - Update these values
const API_ENDPOINT = 'https://your-app.vercel.app/api/chili-submission';
const API_KEY = 'your-api-key-from-env'; // Same as GOOGLE_FORMS_API_KEY

// Field mapping - Update these to match your form question titles
const FIELD_MAPPING = {
  name: 'What is the name of your chili?',
  contestantName: 'What is your name (contestant)?',
  recipe: 'Recipe or preparation method (optional)',
  ingredients: 'List ingredients, separated by commas (optional)',
  allergens: 'List any allergens, separated by commas (optional)',
  spiceLevel: 'Spice level from 1 (mild) to 5 (very hot)',
  description: 'Brief description of your chili (optional)'
};

/**
 * Triggered when form is submitted
 */
function onFormSubmit(e) {
  try {
    Logger.log('Form submitted, processing...');

    // Get form response
    const itemResponses = e.response.getItemResponses();
    const formData = {};

    // Map form responses to API fields
    for (const [apiField, questionTitle] of Object.entries(FIELD_MAPPING)) {
      const response = itemResponses.find(
        item => item.getItem().getTitle() === questionTitle
      );

      if (response) {
        formData[apiField] = response.getResponse();
      }
    }

    Logger.log('Mapped form data:', formData);

    // Send to API
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': API_KEY
      },
      payload: JSON.stringify(formData),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(API_ENDPOINT, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    Logger.log('API Response Code:', responseCode);
    Logger.log('API Response Body:', responseBody);

    if (responseCode === 200) {
      Logger.log('✅ Successfully submitted to database');
    } else {
      Logger.log('❌ Error submitting to database:', responseBody);
    }

  } catch (error) {
    Logger.log('❌ Script error:', error.toString());
  }
}

/**
 * Set up trigger automatically when installed
 */
function setupTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create new form submit trigger
  const form = FormApp.getActiveForm();
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log('✅ Trigger installed successfully');
}
```

5. **Update the configuration at the top:**
   - Replace `API_ENDPOINT` with your Vercel URL + `/api/chili-submission`
   - Replace `API_KEY` with the same key you added to `.env.local`
   - Update `FIELD_MAPPING` question titles to **exactly match** your form questions

6. **Save the script** (💾 icon or Ctrl+S)

---

### **Step 4: Install the Trigger**

1. In the Apps Script editor, select the `setupTrigger` function from the dropdown
2. Click **Run** (▶️ button)
3. **Authorize the script:**
   - Click "Review permissions"
   - Select your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"
4. Check the "Execution log" - you should see "✅ Trigger installed successfully"

---

### **Step 5: Test the Integration**

1. **Submit a test entry** through your Google Form
2. **Check the Apps Script execution log:**
   - Apps Script editor → Left sidebar → "Executions" (clock icon)
   - Look for your submission - it should show "Completed" with logs
3. **Check your admin dashboard:**
   - Go to `/admin` in your app
   - The new entry should appear in "All Entries"

**Troubleshooting:**
- If you see "401 Unauthorized" → API key doesn't match
- If you see "400 Bad Request" → Field mapping is incorrect
- If you see "500 Server Error" → Check Vercel logs

---

## 🔍 How to Check Vercel Logs

If submissions aren't appearing:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **"Logs"** or **"Functions"**
4. Submit a form and watch for `/api/chili-submission` requests
5. Look for errors and adjust accordingly

---

## 🛡️ Security Notes

- ✅ API key is required for all requests
- ✅ API route validates all incoming data
- ✅ Keys are never exposed in the frontend
- ⚠️ Keep your API key secret
- ⚠️ Don't commit `.env.local` to Git

---

## 📝 Field Mapping Reference

| Google Form Answer | → | Database Field | Type |
|-------------------|---|----------------|------|
| "Texas Hot" | → | `name` | string |
| "Joe Chrisman" | → | `contestant_name` | string |
| "Secret recipe..." | → | `recipe` | string |
| "beef, beans, tomatoes" | → | `ingredients` | array |
| "dairy, nuts" | → | `allergens` | array |
| 4 | → | `spice_level` | number (1-5) |
| "My famous chili" | → | `description` | string |

---

## ✅ Success Checklist

- [ ] API key generated and added to `.env.local`
- [ ] API key added to Vercel environment variables
- [ ] App redeployed to Vercel
- [ ] Google Form fields match the mapping
- [ ] Apps Script code added and configuration updated
- [ ] Trigger installed successfully
- [ ] Test submission works
- [ ] Entry appears in admin dashboard

---

## 🚀 What Happens Now

1. User fills out Google Form
2. Apps Script triggers on submit
3. Script sends data to your API endpoint
4. API validates and inserts into Supabase
5. Entry appears immediately in admin dashboard
6. Admin can edit, delete, or generate QR codes
7. Entry becomes available for voting

---

## 🐛 Common Issues

### "Trigger not found"
- Re-run `setupTrigger()` function in Apps Script

### "Invalid API key"
- Make sure the key in Apps Script exactly matches `.env.local`
- Ensure you redeployed after adding the environment variable

### "Field validation errors"
- Check that question titles in `FIELD_MAPPING` exactly match your form
- Use View → Logs in Apps Script to see what data is being sent

### "Entries not appearing"
- Check Vercel function logs
- Verify Supabase connection
- Test the API endpoint directly with Postman

---

Need help? Check the execution logs in Apps Script and Vercel logs for detailed error messages!
