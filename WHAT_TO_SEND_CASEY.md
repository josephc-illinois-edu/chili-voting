# What to Send Casey

## 📧 Email/Message to Casey

Use the message we created earlier, then attach or send him:
- **File:** `SETUP_FOR_CASEY.md`
- **Subject:** "Chili Form Setup - Step-by-Step Instructions"

---

## 🔑 Information Casey Needs from You

### 1. **API Key**

**Generate it first:**
```bash
openssl rand -base64 32
```

**Copy the output** (it will look like this):
```
a9K3x7mP2qR8vW1zN5bT4cH6jL0sG9dF3eY8uI2oP7mX1kV4nB6wQ5rA3tZ8hJ2
```

**⚠️ IMPORTANT:** You need to:
1. Add this to your `.env.local` file:
   ```env
   GOOGLE_FORMS_API_KEY=a9K3x7mP2qR8vW1zN5bT4cH6jL0sG9dF3eY8uI2oP7mX1kV4nB6wQ5rA3tZ8hJ2
   ```

2. Add it to Vercel:
   - Dashboard → Your Project → Settings → Environment Variables
   - Add: `GOOGLE_FORMS_API_KEY` with the same value
   - **Redeploy your app** (important!)

3. Send it to Casey (he'll paste it in the script)

---

### 2. **Website URL**

This is your deployed Vercel URL. It should look like:
```
https://chili-voting-axzg.vercel.app
```

**Don't add** `/api/chili-submission` - Casey's instructions already include that part.

---

## 📝 Example Message to Casey

```
Hey Casey,

Here are the two things you need for the setup:

1. **API Key (keep this private):**
   a9K3x7mP2qR8vW1zN5bT4cH6jL0sG9dF3eY8uI2oP7mX1kV4nB6wQ5rA3tZ8hJ2

2. **Website URL:**
   https://chili-voting-axzg.vercel.app

I've attached a step-by-step guide (SETUP_FOR_CASEY.md).

The trickiest part is matching the "FIELD_MAPPING" to your exact form questions.
If you get stuck, just send me a screenshot and I'll help!

Let me know when you're ready to test it.

Thanks!
```

---

## 🧪 Testing Together

Once Casey completes the setup:

1. **Casey submits a test entry** through his Google Form
2. **Casey checks his Executions log** (clock icon in script editor)
   - Should see "✅ SUCCESS: Entry added to website"
3. **You check your admin dashboard** at `/admin`
   - Should see the test entry appear
4. **Verify you can edit/delete it** in the admin panel

If it works → You're done! 🎉

If it doesn't work:
- Check Casey's Executions log for error messages
- Check your Vercel function logs
- Compare Casey's FIELD_MAPPING to his actual form questions

---

## 🔒 Before You Send

**Complete this checklist:**

- [ ] Generate API key with `openssl rand -base64 32`
- [ ] Add API key to `.env.local`
- [ ] Add API key to Vercel environment variables
- [ ] **Redeploy your Vercel app** (crucial!)
- [ ] Get your Vercel URL (e.g., https://your-app.vercel.app)
- [ ] Send Casey both values
- [ ] Send Casey the `SETUP_FOR_CASEY.md` file

---

## 🆘 If Casey Gets Stuck

Common issues and how to help:

### "Permission denied error"
→ He needs to click "Advanced" → "Go to project (unsafe)" → "Allow"

### "401 Unauthorized" in logs
→ API key doesn't match - either:
  - He copied it wrong (extra space/missing character)
  - You didn't redeploy after adding to Vercel

### "400 Bad Request" in logs
→ FIELD_MAPPING doesn't match his form
  - Ask Casey to send you a screenshot of his form questions
  - Compare them to what's in FIELD_MAPPING
  - They must match EXACTLY (including punctuation)

### "Nothing happens when I submit"
→ Trigger didn't install
  - Ask Casey to run "setupTrigger" again
  - Check if he sees "✅ Trigger installed" in the log

---

## 💡 Pro Tips

1. **Do a quick call** - It's faster than back-and-forth messages
2. **Screen share** - Easiest way to troubleshoot the field mapping
3. **Test immediately** - Don't wait until event day to discover issues
4. **Keep API key private** - Don't commit it to Git or share publicly

---

Good luck! This should save you tons of manual data entry on event day. 🌶️
