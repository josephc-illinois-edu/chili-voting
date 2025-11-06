# 🚀 Google Forms Integration - Quick Start

## 📝 Your Google Form
https://docs.google.com/forms/d/e/1FAIpQLSdSGQHHQrAK7uqgJx9lyjFERVlQyWBcyzGVv-z4GebSCp_Qpw/viewform

---

## ⚡ 5-Minute Setup

### 1️⃣ Generate API Key
```bash
openssl rand -base64 32
```
Copy the output (e.g., `a9K3x7mP2qR8vW1zN5bT4cH6jL0sG9dF3eY8uI2oP7mX1kV4nB6wQ5rA3tZ8hJ2`)

### 2️⃣ Add to Environment Variables

**Local (`.env.local`):**
```env
GOOGLE_FORMS_API_KEY=your-generated-key-here
```

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Add: `GOOGLE_FORMS_API_KEY` = `your-generated-key`
3. **Redeploy**

### 3️⃣ Configure Google Apps Script

1. Open your form → ⋮ menu → **Script editor**
2. Paste the script from `GOOGLE_FORMS_INTEGRATION.md`
3. **Update these lines:**
```javascript
const API_ENDPOINT = 'https://your-app.vercel.app/api/chili-submission';
const API_KEY = 'your-generated-key-here';
```

4. **Update field mapping** to match your exact question titles:
```javascript
const FIELD_MAPPING = {
  name: 'Your exact form question for chili name?',
  contestantName: 'Your exact form question for contestant?',
  // ... etc
};
```

### 4️⃣ Install Trigger

1. Select `setupTrigger` from dropdown
2. Click **Run** ▶️
3. Authorize when prompted
4. Check for "✅ Trigger installed successfully"

### 5️⃣ Test

1. Submit a test entry through your form
2. Check Apps Script → Executions (clock icon)
3. Check Admin Dashboard → Should see new entry!

---

## 🔍 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "401 Unauthorized" | API keys don't match - check `.env.local` and Apps Script |
| "400 Bad Request" | Field mapping wrong - check question titles exactly match |
| "500 Server Error" | Check Vercel logs for details |
| Entry not appearing | Verify API key in Vercel env vars and redeploy |

---

## 📋 Required Form Fields

| Field | Type | Required |
|-------|------|----------|
| Chili Name | Short answer | ✅ |
| Contestant Name | Short answer | ✅ |
| Recipe | Paragraph | ⬜ |
| Ingredients | Paragraph | ⬜ |
| Allergens | Short answer | ⬜ |
| Spice Level (1-5) | Linear scale | ⬜ |
| Description | Paragraph | ⬜ |

---

## 🎯 Expected Flow

```
Form Submitted → Apps Script → API Endpoint → Database → Admin Dashboard
     ↓              ↓              ↓              ↓            ↓
   10sec         instant        instant       instant     appears!
```

---

## 🆘 Need Help?

1. **Apps Script Logs:** Apps Script editor → Executions (clock icon)
2. **Vercel Logs:** Dashboard → Project → Logs tab
3. **Test API directly:** Use Postman or curl:
```bash
curl -X POST https://your-app.vercel.app/api/chili-submission \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{
    "name": "Test Chili",
    "contestantName": "Test User",
    "spiceLevel": 3
  }'
```

---

**See full guide:** `GOOGLE_FORMS_INTEGRATION.md`
