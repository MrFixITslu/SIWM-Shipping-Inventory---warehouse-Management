# Vision79 Shipment Inventory & Warehouse Management (SIWM)

Vision79 SIWM is a modern, full-stack web application for managing shipments, inventory, and warehouse operations. It features a React-based frontend, a Node.js backend with a PostgreSQL database, and AI-powered insights via the Gemini API.

---

## 🚀 Feature Overview

- **Role-Based Authentication:** Secure login and permissions for different user roles (Admin, Manager, Warehouse, Broker, Finance, Technician, Requester).
- **Dashboard:** Real-time metrics, AI insights, and system health at a glance.
- **Incoming Shipments (ASNs):** Track, receive, and process shipments with a financial approval workflow.
- **Inventory Management:** Manage stock, serialized/non-serialized items, and aged inventory. Real-time updates and smart intake.
- **Warehouse Orders:** Internal requests, picking, packing, and fulfillment workflows.
- **Dispatch & Logistics:** Outbound shipments, route planning, and delivery tracking with AI-powered optimization.
- **Vendor & Asset Management:** Supplier and equipment tracking with maintenance logs.
- **Reporting & Analytics:** Custom reports, exports, and AI-powered natural language queries.
- **Notifications:** Real-time alerts and user-configurable preferences.
- **VisionBot AI Chatbot:** In-app assistant for help, logistics questions, and workflow guidance.

---

## 🤖 AI-Powered Features

- **VisionBot Chatbot:** Ask logistics, inventory, or app usage questions. Try "How do I receive a shipment?" or "Show me items below reorder point."
- **AI Analytics:** Use the reporting module to enter natural language queries (e.g., "Show inventory by category for last month").
- **Route Optimization:** In Dispatch & Logistics, use AI to suggest optimal shipping routes based on constraints.
- **Inventory Forecasting:** Predict stock needs and reorder points using historical data and trends.
- **Supplier Performance Analysis:** AI-driven supplier evaluation and recommendations.
- **Warehouse Layout Optimization:** Intelligent space utilization and pick path suggestions.

---

## 📋 Best Practices & Tips

- Use filters and search bars to quickly find records in large tables.
- Check notifications regularly for important system or workflow updates.
- Admins should review user permissions after onboarding new users.
- Use the export feature in reports to save data as PDF or CSV for audits.
- For serialized items, scan barcodes where possible to avoid manual entry errors.
- Consult the in-app Help page for step-by-step guides and workflow explanations.

---

## 🛠️ Troubleshooting & FAQ

- **Failed to fetch dynamically imported module?** Reload the page. If the issue persists, clear your browser cache and ensure you are accessing the app via the correct URL (not file://).
- **Missing permissions?** Contact your admin to review your assigned role and page permissions.
- **Can’t see a module in the sidebar?** You may not have permission. Ask your admin to update your access.
- **Receiving errors on shipment or order actions?** Double-check required fields and ensure you have the correct role for the action.
- **How do I reset my password?** Use the "Forgot Password" link on the login page or ask an admin to reset it for you.

---

## 🔒 Security & Compliance

- All data is encrypted in transit (HTTPS/SSL required in production).
- Role-based access ensures users only see and do what they are permitted.
- Audit logs track all critical actions for compliance and troubleshooting.
- Regularly update your password and never share credentials.
- Admins should periodically review user access and audit logs.

---

## 💬 Support & Feedback

- For technical support, contact your system administrator or IT helpdesk.
- For feature requests or bug reports, use the in-app feedback form or email the support team.
- Consult the in-app Help page and tooltips for additional guidance.

---

## 📖 User Guide

For a detailed, step-by-step user guide, see the in-app **Help** page (accessible from the sidebar) or review `src/pages/HelpPage.tsx` for the latest documentation on workflows, permissions, and best practices.

---

## Tech Stack

- **Frontend:** React, TypeScript, [Vite](https://vite.dev/guide/), Tailwind CSS, Recharts
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with `node-pg-migrate` for schema management.
- **AI:** Google Gemini API

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/download/) (running locally or accessible)

---

## Installation & Setup

Follow these steps to get the application running locally.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

### 2. Install Frontend Dependencies

From the project's **root directory**, run:

```bash
npm install
```

### 3. Setup Backend

Navigate into the backend directory and install its dependencies.

```bash
cd backend
npm install
```

### 4. Configure Backend Environment

The backend requires a `.env` file for configuration.

1.  In the `backend` directory, create a copy of the example environment file:
    ```bash
    cp .env.example .env
    ```
    *(On Windows, use `copy .env.example .env`)*

2.  Open the newly created `.env` file and fill in your details, especially for the database connection and security keys.

    ```env
    # Environment (development, production)
    NODE_ENV=development

    # Server Port
    PORT=4000

    # JWT Secret Key (VERY IMPORTANT: use a long, random string)
    JWT_SECRET=your_super_secret_jwt_key_here

    # Database Connection Details
    DB_USER=postgres
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=vision79_siwm_db

    # Google Gemini API Key (for AI features)
    GEMINI_API_KEY=your_google_gemini_api_key_here

    # Frontend URL for CORS
    CORS_ORIGIN=http://localhost:5173
    ```

### 5. Database Migrations

This project uses `node-pg-migrate` to manage database schema changes. The server **no longer** creates tables automatically.

1.  **Ensure your PostgreSQL server is running** and that a database with the name specified in `backend/.env` exists.

2.  **Run the migrations** from the `backend` directory to set up the schema:
    ```bash
    cd backend
    npm run migrate up
    ```

3.  **For future schema changes**, you will create new migration files instead of editing SQL in the application code. This is a safer, more version-controlled approach to database management.

### 6. Email Service Setup (Optional)

The application can send email notifications for certain events (e.g., new shipment creation). To enable this, you must configure SMTP settings in your `backend/.env` file.

If these variables are not set, email functionality will be disabled, but the application will run without errors.

```env
# --- Email Service (using Gmail as an example) ---
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password_here
EMAIL_FROM_ADDRESS=your_email@gmail.com
EMAIL_FROM_NAME="Vision79 SIWM Notifications"
```

#### **IMPORTANT: Using Gmail with `nodemailer`**

If you are using a Gmail account for `EMAIL_USER`, you **cannot** use your regular Google account password for `EMAIL_PASS`. Due to Google's security policies, you must generate and use an **App Password**.

**How to Generate a Google App Password:**

1.  **Enable 2-Step Verification**: You must have 2-Step Verification enabled on your Google Account.
    -   Go to your [Google Account](https://myaccount.google.com/).
    -   Navigate to the **Security** tab.
    -   Under "How you sign in to Google," find and enable **2-Step Verification**.

2.  **Generate the App Password**:
    -   Once 2-Step Verification is on, go back to the **Security** tab.
    -   Click on **App passwords** (it will be in the same "How you sign in to Google" section). You may need to sign in again.
    -   On the App passwords page:
        -   Click **Select app** and choose **Mail**.
        -   Click **Select device** and choose **Other (Custom name)**.
        -   Give it a name (e.g., "Vision79 SIWM Dev") and click **Generate**.
    -   Google will display a 16-character password in a yellow box. **This is your App Password.**

3.  **Use the App Password**:
    -   Copy this 16-character password (without spaces).
    -   Paste it into the `EMAIL_PASS` field in your `.env` file.

---

## Running the Application

Once installation and configuration are complete, you can start the application.

1.  Navigate back to the **project root directory** (if you are in the `backend` directory, run `cd ..`).

2.  Run the main development script:

    ```bash
    npm run dev
    ```

This single command will use `concurrently` to start both the frontend (Vite) and backend (Nodemon) servers in parallel.

-   The **Frontend** will be accessible at `http://localhost:5173`
-   The **Backend API** will be running at `http://localhost:4000`

Users can be created via the "Register" link on the login page.