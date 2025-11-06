# Contestant Self-Service Guide

This guide explains how chili cook-off contestants can manage their own entries, upload photos, and update information using their unique entry code.

## Overview

After your chili entry is registered (either through the admin panel or Google Forms sync), you receive a unique 6-character entry code. This code allows you to:

- View your entry details
- Upload or update your chili presentation photo
- Edit your entry information (name, description, ingredients, etc.)
- Check your current vote statistics

## Getting Started

### Finding Your Entry Code

Your entry code is provided in two ways:

1. **QR Code**: A printable QR code is generated for your entry that contestants can scan
2. **Direct Entry**: You can manually enter your 6-character code at the upload page

### Accessing Your Entry

**Option 1: Scan QR Code**

1. Open your smartphone camera or QR code scanner
2. Point it at your printed QR code
3. Tap the notification to open the link
4. You'll be taken directly to your entry management page

**Option 2: Manual Entry**

1. Visit the voting app URL
2. Navigate to the "Upload" page
3. Enter your 6-character entry code
4. Click "Access Entry"

## Managing Your Entry

### Viewing Your Entry

Once authenticated with your entry code, you can see:

- **Chili Name**: The name of your chili
- **Contestant Name**: Your name
- **Email**: Your contact email
- **Chili Type**: Type classification (traditional, vegetarian, white, etc.)
- **Spice Level**: Heat rating (1-5)
- **Ingredients**: List of ingredients
- **Allergens**: Allergen information
- **Description**: Special notes or story about your chili
- **Current Photo**: Your uploaded presentation photo (if any)
- **Vote Statistics**: Total votes and average rating

### Uploading Photos

**Photo Requirements:**

- Accepted formats: JPEG, PNG, WebP
- Maximum file size: 5MB
- Recommended: Well-lit photo of your chili presentation

**Upload Steps:**

1. Access your entry using your entry code
2. Click "Choose File" or drag-and-drop a photo
3. Select your chili presentation photo
4. Click "Upload Photo"
5. Wait for confirmation message
6. Your photo will appear in the voting interface

**Updating Photos:**

- You can replace your photo at any time before the deadline
- Simply upload a new photo - it will replace the previous one
- The old photo is automatically deleted from storage

### Editing Entry Information

You can update the following fields:

- **Chili Name**: Change your chili's name
- **Description**: Update special notes or story
- **Ingredients**: Modify ingredient list (comma-separated)
- **Allergens**: Update allergen information (comma-separated)
- **Spice Level**: Adjust heat rating (1-5 scale)

**Edit Steps:**

1. Access your entry using your entry code
2. Click "Edit Entry" button
3. Modify any fields you want to change
4. Click "Save Changes"
5. Wait for confirmation message

**Field Validation:**

- **Chili Name**: Required, 1-100 characters
- **Description**: Optional, max 500 characters
- **Ingredients**: Required, comma-separated list
- **Allergens**: Optional, comma-separated list
- **Spice Level**: Number between 1-5

**Security Note:** HTML and script tags are automatically removed for security.

## Important Information

### Deadlines

All uploads and edits must be completed by the deadline set by the event organizer. The deadline is displayed on the upload page.

- **Before Deadline**: You can upload photos and edit your entry freely
- **After Deadline**: All upload and edit functions are disabled
- **Admin Override**: Event administrators can still make changes after the deadline

### Entry Code Security

- **Keep it private**: Your entry code grants access to edit your entry
- **Don't share**: Only you and event administrators should know your code
- **No password recovery**: Entry codes cannot be changed or recovered if lost
- **Contact admin**: If you lose your code, contact the event organizer

### What You Cannot Change

Some fields are locked after initial registration:

- **Contestant Name**: Fixed at registration
- **Contestant Email**: Fixed at registration
- **Entry Code**: Cannot be changed
- **Vote Count**: Read-only (determined by voter activity)
- **Average Rating**: Read-only (calculated from votes)

## Troubleshooting

### "Invalid or expired entry code"

**Possible causes:**
- Entry code is incorrect (check for typos)
- Entry code contains special characters (only letters and numbers)
- Entry doesn't exist in the system

**Solutions:**
- Double-check your entry code for accuracy
- Verify you're using the correct code (case-insensitive)
- Contact the event organizer to verify your registration

### "Photo upload failed"

**Possible causes:**
- File is too large (over 5MB)
- Invalid file format (not JPEG, PNG, or WebP)
- Network connection issue
- Server storage limit reached

**Solutions:**
- Compress your image to reduce file size
- Convert image to JPEG format
- Check your internet connection
- Try again in a few minutes
- Contact event organizer if problem persists

### "Upload/edit deadline has passed"

**Possible causes:**
- Current time is past the configured deadline
- Server time zone difference

**Solutions:**
- Contact event organizer to request deadline extension
- If urgent, ask admin to make changes on your behalf
- Plan to upload earlier next time

### "Changes failed to save"

**Possible causes:**
- Network connection interrupted
- Invalid data in form fields
- Server error

**Solutions:**
- Check your internet connection
- Verify all required fields are filled
- Remove any special characters that might cause issues
- Refresh page and try again
- Contact event organizer if problem persists

## Privacy and Data

### What Information is Public

- Chili name
- Contestant name
- Chili type
- Spice level
- Ingredients
- Allergens
- Description
- Presentation photo
- Vote count and average rating

### What Information is Private

- Contestant email (visible only to you and administrators)
- Entry code (known only to you and administrators)
- Individual voter ratings (only aggregate statistics are shown)

### Data Usage

Your information is used solely for:
- Displaying your entry in the voting interface
- Allowing voters to make informed decisions
- Providing you access to manage your entry
- Communicating event information (via email)

## Support

For technical issues or questions:

1. **Check this guide** for troubleshooting steps
2. **Contact event organizer** via the provided email
3. **Review admin documentation** if you have admin access

## API Reference (Advanced)

For developers or those interested in the technical details:

### Upload Photo Endpoint

```
POST /api/upload-photo
Content-Type: multipart/form-data

Form Data:
- entryCode: string (6 characters)
- photo: File (image file)

Response:
{
  "message": "Photo uploaded successfully",
  "photoUrl": "https://..."
}
```

### Update Entry Endpoint

```
POST /api/update-entry
Content-Type: application/json

Body:
{
  "entryCode": "ABC123",
  "name": "Spicy Texas Chili",
  "description": "Traditional recipe...",
  "ingredients": "Beef, Tomatoes, Peppers",
  "allergens": "None",
  "spiceLevel": 4
}

Response:
{
  "message": "Entry updated successfully"
}
```

Both endpoints validate:
- Entry code authenticity
- Deadline enforcement
- Data sanitization
- File size/type restrictions

## Tips for Best Results

### Photo Tips

1. **Lighting**: Take photos in natural light or well-lit areas
2. **Angle**: Shoot from slightly above at 45-degree angle
3. **Background**: Use plain, clean background
4. **Focus**: Ensure chili is in sharp focus
5. **Composition**: Fill frame with your chili presentation
6. **Timing**: Upload before the rush near deadline

### Description Tips

1. **Be descriptive**: Share what makes your chili special
2. **Tell a story**: Mention family recipes or inspiration
3. **Highlight uniqueness**: What sets your chili apart?
4. **Be concise**: Voters appreciate clear, readable descriptions
5. **Check spelling**: Proofread before saving

### Ingredient Tips

1. **Be specific**: "Ancho chili peppers" vs "peppers"
2. **List key ingredients**: Focus on what makes your recipe unique
3. **Order matters**: List main ingredients first
4. **Allergen awareness**: Double-check allergen information
5. **Update if needed**: Fix mistakes as soon as you notice them

## Version History

- **v1.0** (2025-11-06): Initial contestant self-service documentation
  - Entry code authentication
  - Photo upload/update capability
  - Entry editing functionality
  - Deadline enforcement
  - Security and validation

---

**Need help?** Contact your event organizer or administrator for assistance.
