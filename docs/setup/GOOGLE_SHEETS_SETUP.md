# Google Sheets Integration Setup

This guide explains how to set up Google Sheets integration to automatically sync chili cook-off entries from a Google Forms response sheet.

## Overview

The Google Sheets integration allows you to:
- Automatically import chili entries from Google Forms responses
- Sync data with one click from the admin panel
- Avoid duplicate entries (checks by contestant name and chili name)
- Parse form data including ingredients, allergens, and heat levels

## Prerequisites

- A Google Cloud Project with the Google Sheets API enabled
- A Google Service Account with appropriate permissions
- Your Google Sheet must be shared with the service account email

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Note your Project ID

## Step 2: Enable Google Sheets API

1. In your Google Cloud Project, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click **Enable**

## Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - Name: `chili-voting-sheets-sync` (or any name you prefer)
   - Description: `Service account for syncing chili entries from Google Sheets`
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

## Step 4: Create Service Account Keys

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file

**IMPORTANT:** Keep this JSON file secure! It contains credentials to access your Google Sheets.

## Step 5: Share Your Google Sheet

1. Open your Google Sheet with the form responses
2. Click **Share** button
3. Enter the service account email (found in the JSON file as `client_email`)
   - It looks like: `chili-voting-sheets-sync@your-project.iam.gserviceaccount.com`
4. Set permission to **Viewer**
5. Uncheck "Notify people" and click **Share**

## Step 6: Configure Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google Sheets Configuration
GOOGLE_SHEETS_ID=13YOqXtgdwKARjP2lhgVIYuREiVM50bF75ntgpLdHO8g

# Option 1: Use the entire JSON credentials (recommended for deployment)
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Option 2: Use separate fields (alternative)
# GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Admin Secret (required for sync API endpoint)
ADMIN_SECRET_KEY=your-secure-admin-password
NEXT_PUBLIC_ADMIN_SECRET_KEY=your-secure-admin-password
```

### Getting the Spreadsheet ID

The spreadsheet ID is in the URL of your Google Sheet:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

### Preparing the JSON Credentials

From the downloaded JSON file, you can either:

**Option 1 (Recommended):** Copy the entire JSON content as a single-line string:
```bash
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

**Option 2:** Extract specific fields:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=the_client_email_field
GOOGLE_PRIVATE_KEY="the_private_key_field_with_\n_for_newlines"
```

**Note:** Make sure to preserve the `\n` characters in the private key.

## Step 7: Verify Setup

Test your setup by running:

```bash
npm run dev
```

Then:
1. Log in to the admin panel at `/admin`
2. Click the **"Sync Google Sheets"** button
3. Check for success message or error details

## Google Form Structure

The integration expects your Google Form responses in this format:

| Column | Description |
|--------|-------------|
| Timestamp | When the form was submitted |
| Email Address | Contestant's email |
| First Name | Contestant's first name |
| Last Name | Contestant's last name |
| Chili Name | Name of the chili entry |
| Type of Chili | e.g., traditional, vegetarian, white |
| Heat Level | Mild, Medium, Hot, Extra Hot |
| Ingredients & Allergen Information | Comma or newline-separated list |
| Potential Allergens | List of allergens |
| Special Notes or Story | Optional description |

## Data Mapping

The sync process maps Google Form data to your database:

- **Contestant Name** = `First Name` + `Last Name`
- **Chili Name** = Form field "Chili Name:"
- **Spice Level** (1-5):
  - Mild = 1
  - Medium = 2
  - Hot = 3
  - Extra Hot = 4
- **Ingredients** = Parsed from comma/newline-separated list
- **Allergens** = Parsed from comma/newline-separated list (empty if "no allergens" or "none")
- **Description** = Combination of "Type of Chili" and "Special Notes"

## Deployment Notes

### Vercel

When deploying to Vercel:

1. Add environment variables in **Project Settings** > **Environment Variables**
2. For `GOOGLE_SHEETS_CREDENTIALS`, paste the entire JSON as a single line
3. Make sure to add variables for all environments (Production, Preview, Development)

### Other Platforms

For other platforms (Netlify, AWS, etc.):
- Follow their documentation for adding environment variables
- Ensure the JSON credentials are properly escaped
- Test the sync functionality after deployment

## Troubleshooting

### Error: "Failed to fetch data from Google Sheets"

**Possible causes:**
- Service account doesn't have access to the sheet
- Incorrect spreadsheet ID
- Google Sheets API not enabled
- Invalid credentials

**Solutions:**
- Verify the sheet is shared with the service account email
- Double-check the `GOOGLE_SHEETS_ID` in your environment variables
- Confirm the Google Sheets API is enabled in your Google Cloud Project
- Verify your credentials JSON is complete and valid

### Error: "Unauthorized"

**Possible causes:**
- Missing or incorrect `ADMIN_SECRET_KEY`
- Admin secret doesn't match between client and server

**Solutions:**
- Ensure `ADMIN_SECRET_KEY` and `NEXT_PUBLIC_ADMIN_SECRET_KEY` are set and match
- Restart your development server after changing environment variables

### Entries Not Syncing

**Possible causes:**
- Entries already exist (sync skips duplicates)
- Empty rows in the spreadsheet
- Missing required fields (Chili Name or Contestant Name)

**Solutions:**
- Check the sync results message for details
- Review the spreadsheet for empty or incomplete rows
- Check the browser console or server logs for detailed error messages

## Security Considerations

1. **Never commit credentials** - Add `.env.local` to `.gitignore`
2. **Use environment variables** - Don't hardcode credentials in your code
3. **Limit service account permissions** - Only grant Viewer access to the sheet
4. **Rotate keys periodically** - Create new service account keys every few months
5. **Monitor access** - Check Google Cloud Console for unusual activity

## API Endpoints

### POST /api/sync-google-sheets

Syncs entries from Google Sheets to the database.

**Headers:**
- `x-admin-secret`: Your admin secret key

**Request Body (optional):**
```json
{
  "spreadsheetId": "override-default-sheet-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync completed. 2 new entries added, 1 skipped, 0 errors.",
  "synced": 2,
  "skipped": 1,
  "errors": 0,
  "details": [
    {
      "name": "Butternut Squash Chipotle Chili",
      "contestant": "Caroline Nappo",
      "status": "synced"
    }
  ]
}
```

### GET /api/sync-google-sheets

Preview entries from Google Sheets without syncing.

**Headers:**
- `x-admin-secret`: Your admin secret key

**Response:**
```json
{
  "success": true,
  "count": 2,
  "entries": [
    {
      "name": "Butternut Squash Chipotle Chili",
      "contestant": "Caroline Nappo",
      "spiceLevel": 1,
      "ingredients": ["Butternut squash", "red pepper", "tomato"],
      "allergens": []
    }
  ]
}
```

## Manual Sync via API

You can also trigger sync via command line:

```bash
curl -X POST http://localhost:3000/api/sync-google-sheets \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-admin-secret" \
  -d '{}'
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Verify your Google Cloud Project configuration
4. Ensure all environment variables are set correctly
