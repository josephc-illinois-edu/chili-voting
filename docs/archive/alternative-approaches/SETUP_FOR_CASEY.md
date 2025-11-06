# Google Form Setup Instructions for Casey

## What This Does
When someone submits your Google Form, their chili entry will automatically appear in our voting system. No manual copying needed!

---

## Before You Start

**You'll need from me:**
1. A special code called an "API key" (I'll send this separately)
2. The website address where our app is hosted (like `https://chili-voting.vercel.app`)

**Time needed:** About 10 minutes

---

## Step-by-Step Instructions

### **Step 1: Open the Script Editor**

1. Open your Google Form (the one for chili submissions)
2. Click the **three dots** in the top-right corner (⋮)
3. Click **"Script editor"**
   - A new tab will open with a code editor

![Three dots menu location]

---

### **Step 2: Paste the Code**

1. You'll see some text in the editor - **delete everything**
2. Copy the code below and paste it in:

```javascript
/**
 * Chili Form to Website Integration
 * This automatically sends form submissions to our voting website
 */

// ===== CONFIGURATION =====
// I will provide these values for you:
const API_ENDPOINT = 'PASTE_WEBSITE_URL_HERE/api/chili-submission';
const API_KEY = 'PASTE_API_KEY_HERE';

// Match these to your form questions (see Step 3 below):
const FIELD_MAPPING = {
  name: 'What is the name of your chili?',
  contestantName: 'Your name (contestant)',
  recipe: 'Recipe or preparation method',
  ingredients: 'Ingredients (comma-separated)',
  allergens: 'Any allergens?',
  spiceLevel: 'Spice level (1-5)',
  description: 'Brief description'
};

// ===== DO NOT EDIT BELOW THIS LINE =====

function onFormSubmit(e) {
  try {
    Logger.log('New form submission received');

    const itemResponses = e.response.getItemResponses();
    const formData = {};

    for (const [apiField, questionTitle] of Object.entries(FIELD_MAPPING)) {
      const response = itemResponses.find(
        item => item.getItem().getTitle() === questionTitle
      );
      if (response) {
        formData[apiField] = response.getResponse();
      }
    }

    Logger.log('Sending to website:', formData);

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

    Logger.log('Response code:', responseCode);
    Logger.log('Response:', responseBody);

    if (responseCode === 200) {
      Logger.log('✅ SUCCESS: Entry added to website');
    } else {
      Logger.log('❌ ERROR: Something went wrong');
      Logger.log('Details:', responseBody);
    }

  } catch (error) {
    Logger.log('❌ SCRIPT ERROR:', error.toString());
  }
}

function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  const form = FormApp.getActiveForm();
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log('✅ Trigger installed - form is now connected!');
}
```

3. **Save** by clicking the disk icon (💾) or pressing Ctrl+S

---

### **Step 3: Update the Configuration**

Find the **CONFIGURATION** section at the top of the code. You need to update 3 things:

#### **A. API_ENDPOINT**
Replace `PASTE_WEBSITE_URL_HERE` with the website address I give you.

**Example:**
```javascript
const API_ENDPOINT = 'https://chili-voting.vercel.app/api/chili-submission';
```

#### **B. API_KEY**
Replace `PASTE_API_KEY_HERE` with the secret key I give you.

**Example:**
```javascript
const API_KEY = 'a9K3x7mP2qR8vW1zN5bT4cH6jL0sG9dF3eY8uI2oP7mX1kV4nB';
```

#### **C. FIELD_MAPPING**
Update the text in quotes to **exactly match** your form questions.

**How to find your question titles:**
1. Go back to your Google Form (not the script editor)
2. Look at each question title
3. Copy each title EXACTLY (including capital letters, spaces, punctuation)

**Example:**
If your form question is: **"What's your chili called?"**

Then update the code to:
```javascript
name: "What's your chili called?",
```

**Do this for each field:**
- `name` → Your question asking for the chili name
- `contestantName` → Your question asking for the person's name
- `recipe` → Your question about recipe (if you have one)
- `ingredients` → Your question about ingredients (if you have one)
- `allergens` → Your question about allergens (if you have one)
- `spiceLevel` → Your question about spice level (if you have one)
- `description` → Your question for description (if you have one)

**Note:** If you don't have a certain field, that's okay - leave it as is.

4. **Save** again (💾 or Ctrl+S)

---

### **Step 4: Activate the Integration**

Now we need to "install" the connection:

1. At the top of the script editor, find the **dropdown menu** (it probably says "Select function")
2. Click it and select **"setupTrigger"**
3. Click the **Run button** (▶️ triangle icon)

4. **You'll see a permission screen:**
   - Click **"Review permissions"**
   - Choose your Google account
   - Click **"Advanced"** at the bottom
   - Click **"Go to [Untitled project] (unsafe)"**
     - Don't worry - this is safe! Google just shows this because it's a custom script
   - Click **"Allow"**

5. **Check if it worked:**
   - Look at the bottom of the screen for "Execution log"
   - You should see: `✅ Trigger installed - form is now connected!`

---

### **Step 5: Test It!**

1. **Submit a test entry** through your Google Form
   - Use fake data like "Test Chili" and your name

2. **Check if the script ran:**
   - In the script editor, look for a **clock icon** (⏱️) on the left side
   - Click it to see "Executions"
   - You should see your test submission with "Completed" status
   - Click it to see the logs - look for `✅ SUCCESS`

3. **Tell me to check the admin dashboard**
   - I can verify the entry appeared on our end

---

## ✅ You're Done!

From now on, every form submission will automatically appear in our voting system. You don't need to do anything else!

---

## 🆘 Troubleshooting

### "I see an error when I run setupTrigger"
- Make sure you saved the code (💾) before running
- Try clicking Run again

### "I got permissions but nothing happened"
- Check the "Execution log" at the bottom - it should show success
- If you see red errors, take a screenshot and send it to me

### "Test submission didn't work"
- Double-check that the question titles in FIELD_MAPPING exactly match your form
- Check the "Executions" log (clock icon) for error messages
- Send me a screenshot of any errors

### "I need to change a form question"
- If you change a question title in your form, you must update FIELD_MAPPING in the script to match

---

## 📞 Need Help?

If you get stuck at any point, just text/email me! I can:
- Do a quick video call to walk through it
- Fix any errors you're seeing
- Help match the field mapping

The hardest part is making sure the question titles match exactly - we can troubleshoot that together if needed!

---

## Summary Checklist

- [ ] Open Script Editor from form
- [ ] Paste the code
- [ ] Update API_ENDPOINT with website URL (from me)
- [ ] Update API_KEY with secret key (from me)
- [ ] Update FIELD_MAPPING to match your exact form questions
- [ ] Save the code
- [ ] Run "setupTrigger" function
- [ ] Grant permissions
- [ ] Submit test entry
- [ ] Verify success in Executions log
- [ ] Let me know it's working!

Thanks for helping set this up! 🌶️
