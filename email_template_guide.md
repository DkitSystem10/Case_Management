# EmailJS Template Guide

Follow these steps to set up your email template in the [EmailJS Dashboard](https://dashboard.emailjs.com/).

## 1. Create a New Template
- **Template ID**: (Copy this and add to your `.env` file as `VITE_EMAILJS_TEMPLATE_ID`)
- **Subject**: `Appointment Confirmation – {{date}}`

## 2. Template Configuration
Go to the **"Settings"** tab of the template:
- **To Email**: `{{email}}`
- **From Name**: `ALR Lawyer Private Limited`
- **Reply To**: `dkit.system10@gmail.com`

---

## 3. Email Body (HTML)
Copy the code below and paste it into the **"Content"** section (use the **"Edit Code"** or **"HTML"** button if available, or just paste into the main editor):

```html
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 25px; border-radius: 8px;">
    <h2 style="color: #2c3e50;">Appointment Confirmation – {{date}}</h2>
    
    <p>Dear <strong>{{name}}</strong>,</p>

    <p>Your appointment request submitted through our portal has been successfully approved.</p>

    <div style="background-color: #f9f9f9; padding: 15px; border-left: 5px solid #3498db; margin: 20px 0;">
        <h3 style="margin-top: 0;">Appointment Details:</h3>
        <p style="margin: 5px 0;"><strong>Date:</strong> {{date}}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> {{time}}</p>
        <p style="margin: 5px 0;"><strong>Lawyer Name:</strong> {{lawyer}}</p>
        <p style="margin: 5px 0;"><strong>Case ID:</strong> {{case_id}}</p>
    </div>

    <p>Please arrive on time and carry any required documents.</p>

    <p>If you have any queries, feel free to contact us at <a href="mailto:dkit.system10@gmail.com">dkit.system10@gmail.com</a>.</p>

    <p>Thank you for choosing <strong>ALR Lawyer Private Limited</strong>.</p>

    <br>
    <p>Warm regards,<br>
    <strong>ALR Lawyer Private Limited</strong></p>
</div>
```

---

## 4. Key Variables Used
These are the variables sent from the code (`emailService.ts`):
- `{{name}}` -> Client Full Name
- `{{email}}` -> Client Email
- `{{date}}` -> Appointment Date
- `{{time}}` -> Time Slot
- `{{lawyer}}` -> Assigned Lawyer Name
- `{{case_id}}` -> Generated Case ID
