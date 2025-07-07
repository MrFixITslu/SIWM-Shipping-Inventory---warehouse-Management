# Vision79 Shipment Inventory & Warehouse Management (SIWM)

Vision79 SIWM is a modern, full-stack web application designed to provide a comprehensive solution for managing shipments, inventory, and warehouse operations. It features a React-based frontend, a Node.js backend with a PostgreSQL database, and AI-powered insights via the Gemini API.

## Features

- **Role-Based Authentication**: Secure login for admins, managers, and users.
- **Dashboard**: At-a-glance view of key metrics and AI-driven operational insights.
- **End-to-End Logistics**: Manage Incoming Shipments (ASNs), Inventory (serialized and non-serialized), Warehouse Orders, and Dispatch.
- **Vendor & Asset Management**: Track suppliers and internal warehouse assets with maintenance logs.
- **Real-time Updates**: User interface updates instantly across all clients using Server-Sent Events (SSE).
- **Reporting & Analytics**: Generate detailed reports with an AI-powered natural language query interface.
- **AI Chatbot**: An integrated "VisionBot" to assist users with application features and logistics questions.
- **Notifications**: A full notification center with user-configurable preferences.

## Tech Stack

- **Frontend**: React, TypeScript, [Vite](https://vite.dev/guide/), Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with `node-pg-migrate` for schema management.
- **AI**: Google Gemini API

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