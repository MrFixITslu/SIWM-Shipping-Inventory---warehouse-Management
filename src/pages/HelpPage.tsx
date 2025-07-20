import React from 'react';
import PageContainer from '@/components/PageContainer';
import { APP_NAME } from '@/constants';

const HelpPage: React.FC = () => {
  const sectionTitleClass = "text-2xl font-semibold text-primary-600 dark:text-primary-400 mt-8 mb-3 pb-2 border-b border-secondary-300 dark:border-secondary-700";
  const subSectionTitleClass = "text-xl font-medium text-secondary-800 dark:text-secondary-200 mt-6 mb-2";
  const paragraphClass = "text-secondary-700 dark:text-secondary-300 mb-3 leading-relaxed";
  const listClass = "list-disc list-inside space-y-2 text-secondary-700 dark:text-secondary-300 mb-3 pl-4";
  const stepClass = "font-semibold text-secondary-800 dark:text-secondary-100";
  const codeBlockClass = "p-1 bg-secondary-100 dark:bg-secondary-800 rounded text-sm font-mono text-secondary-700 dark:text-secondary-300 my-1 inline-block";
  const roleClass = "font-mono font-bold text-purple-600 dark:text-purple-400";

  return (
          <PageContainer title="Vision79 Shipping, Inventory & Warehouse Management - User Guide">
      <div className="prose dark:prose-invert max-w-none">
        {/* Feature Overview */}
        <h2 className={sectionTitleClass}>Feature Overview</h2>
        <ul className={listClass}>
          <li><strong>Role-Based Authentication:</strong> Secure login and permissions for different user roles.</li>
          <li><strong>Dashboard:</strong> Real-time metrics, AI insights, and system health.</li>
          <li><strong>Incoming Shipments (ASNs):</strong> Track, receive, and process shipments with financial workflow.</li>
          <li><strong>Inventory Management:</strong> Manage stock, serialized/non-serialized items, and aged inventory.</li>
          <li><strong>Warehouse Orders:</strong> Internal requests, picking, packing, and fulfillment.</li>
          <li><strong>Dispatch & Logistics:</strong> Outbound shipments, route planning, and delivery tracking.</li>
          <li><strong>Vendor & Asset Management:</strong> Supplier and equipment tracking with maintenance logs.</li>
          <li><strong>Reporting & Analytics:</strong> Custom reports, exports, and AI-powered queries.</li>
          <li><strong>Notifications:</strong> Real-time alerts and user-configurable preferences.</li>
          <li><strong>VisionBot AI Chatbot:</strong> In-app assistant for help and logistics questions.</li>
        </ul>

        <p className={paragraphClass}>
          Welcome to the {APP_NAME} User Guide! This guide will help you understand and effectively use the features of our comprehensive Shipment Inventory & Warehouse Management system.
        </p>

        <h2 className={sectionTitleClass}>Getting Started</h2>
        <h3 className={subSectionTitleClass}>Navigating the Interface</h3>
        <p className={paragraphClass}>
          The application is designed for ease of use:
        </p>
        <ul className={listClass}>
          <li><strong className={stepClass}>Sidebar:</strong> Located on the left, it provides access to all major modules you have permission to view. It can be collapsed or expanded for more screen space.</li>
          <li><strong className={stepClass}>Action Buttons:</strong> Typically found near the page title or within tables, these buttons (e.g., <code className={codeBlockClass}>Add Item</code>, <code className={codeBlockClass}>Edit</code>, <code className={codeBlockClass}>Delete</code>) allow you to perform actions.</li>
          <li><strong className={stepClass}>Search & Filter:</strong> Most list views include a search bar and filters to quickly find specific records.</li>
        </ul>

        <h3 className={subSectionTitleClass}>User Roles</h3>
        <p className={paragraphClass}>
            Your access to different modules is determined by your user role, which is assigned by an administrator. Key roles include <span className={roleClass}>Requester</span>, <span className={roleClass}>Warehouse</span>, <span className={roleClass}>Broker</span>, <span className={roleClass}>Finance</span>, <span className={roleClass}>Technician</span>, and <span className={roleClass}>Admin</span>.
        </p>
        
        {/* Dashboard Module */}
        <h2 className={sectionTitleClass}>Dashboard</h2>
        <p className={paragraphClass}>
          The Dashboard provides a high-level overview of your warehouse operations with key metrics and AI-driven insights. It is the central hub for real-time information.
        </p>

        {/* Incoming Shipments (ASNs) Module */}
        <h2 className={sectionTitleClass}>Incoming Shipments (ASNs)</h2>
        <p className={paragraphClass}>
          Manage Advance Shipping Notices from your suppliers to track expected deliveries and handle associated fees.
        </p>
        <h3 className={subSectionTitleClass}>How to Add a New Incoming Shipment:</h3>
        <ol className={listClass}>
          <li>Navigate to "Incoming Shipments" from the sidebar.</li>
          <li>Click the <strong className={stepClass}>"Add Incoming Shipment"</strong> button.</li>
          <li>In the modal, fill in the P.O. Number, Supplier, Expected Arrival Date, and other core details.</li>
          <li>You must assign a <strong className={stepClass}>Broker</strong> from the dropdown list. This is critical for the financial workflow.</li>
          <li>Optionally, attach relevant documents like the P.O. file or invoices.</li>
          <li>Click <strong className={stepClass}>"Add Shipment"</strong>.</li>
        </ol>
        <h3 className={subSectionTitleClass}>Broker & Finance Workflow for Incoming Shipments</h3>
        <p className={paragraphClass}>
            This workflow ensures that all costs associated with an incoming shipment are approved before the shipment is processed into inventory.
        </p>
         <ol className={listClass}>
            <li><strong className={stepClass}>View Details:</strong> Click on any shipment row in the table to open the detailed view panel.</li>
            <li><strong className={stepClass}>Broker Fee Entry:</strong> If you are a <span className={roleClass}>Broker</span>, you will see an <strong className={stepClass}>"Enter Fees"</strong> button for shipments awaiting submission. Click it to open a modal where you can enter costs for duties, shipping, and storage.</li>
            <li><strong className={stepClass}>Finance Approval:</strong> Once fees are submitted, users in the <span className={roleClass}>Finance</span> group are notified. In the shipment's detail view, they will see an <strong className={stepClass}>"Approve Funds"</strong> button. They can review the submitted fees and either <strong className={stepClass}>Approve</strong> or <strong className={stepClass}>Reject</strong> them. If fees are rejected, the Broker will be notified to correct and resubmit them.</li>
            <li><strong className={stepClass}>Broker Payment Confirmation:</strong> After funds are approved, the <span className={roleClass}>Broker</span> sees a <strong className={stepClass}>"Confirm Payment"</strong> button. The Broker uses this to confirm they have paid the fees and can optionally upload a receipt.</li>
        </ol>

        <h3 className={subSectionTitleClass}>Receiving Shipments into Inventory</h3>
        <p className={paragraphClass}>
            This is the final step for an incoming shipment, performed by a <span className={roleClass}>Warehouse</span> user once the physical goods arrive.
        </p>
        <ol className={listClass}>
            <li>In the shipment's detail view, once payment is confirmed, click the <strong className={stepClass}>"Receive Items"</strong> button.</li>
            <li>A "Receive Items" modal will open, listing all expected items from the shipment.</li>
            <li>For each non-serialized item, enter the <strong className={stepClass}>actual quantity</strong> you have received.</li>
            <li>For serialized items, scan or type each individual <strong className={stepClass}>serial number</strong> into the text area. The received quantity will update automatically.</li>
            <li>Once all items are counted, click <strong className={stepClass}>"Complete Receiving"</strong> to add them to inventory.</li>
            <li>The system will automatically update inventory levels. If there are any discrepancies between expected and received amounts, the shipment status will be set to <code className={codeBlockClass}>Processing</code> and a notification will be generated for review. If everything matches, the status will be set to <code className={codeBlockClass}>Arrived</code>.</li>
            <li>For shipments in <code className={codeBlockClass}>Processing</code> status (indicating discrepancies), click the <strong className={stepClass}>"Review & Confirm"</strong> button to review the processed items and resolve any issues.</li>
            <li>In the review modal, you can optionally send a notification and then click <strong className={stepClass}>"Confirm Complete"</strong> to finalize the transaction and update all logs.</li>
            <li>Once the shipment is marked as <code className={codeBlockClass}>Arrived</code>, warehouse users can optionally click <strong className={stepClass}>"Mark as Processed"</strong> to indicate the shipment is fully complete.</li>
        </ol>

        {/* Inventory Management Module */}
        <h2 className={sectionTitleClass}>Inventory Management</h2>
        <p className={paragraphClass}>
          Track your stock levels, item details, and manage serialized items. This is your central repository for all physical items.
        </p>
        
        {/* Warehouse Orders Module */}
        <h2 className={sectionTitleClass}>Warehouse Orders</h2>
        <p className={paragraphClass}>
          Create and manage internal requests for items from your warehouse inventory, often initiated by a <span className={roleClass}>Requester</span> or <span className={roleClass}>Technician</span>.
        </p>
        <h3 className={subSectionTitleClass}>Order Fulfillment Workflow:</h3>
        <ol className={listClass}>
          <li><strong className={stepClass}>Creation:</strong> A user creates an order, specifying the department and the items needed.</li>
          <li><strong className={stepClass}>Picking:</strong> A <span className={roleClass}>Warehouse</span> user opens the order from the "Dispatch & Logistics" queue and clicks the <strong className={stepClass}>Pick Items</strong> action. In the picking modal, they confirm the items and enter serial numbers if required. This moves the order status to <code className={codeBlockClass}>Packed</code>.</li>
          <li><strong className={stepClass}>Dispatch:</strong> Once an order is packed, the warehouse user can click the <strong className={stepClass}>Create Dispatch</strong> action (Paper Airplane icon) to create an outbound shipment record.</li>
        </ol>

        {/* Dispatch & Logistics Module */}
        <h2 className={sectionTitleClass}>Dispatch & Logistics</h2>
        <p className={paragraphClass}>
          This page is the central hub for order fulfillment and managing outbound shipments.
        </p>
        <h3 className={subSectionTitleClass}>Outbound Shipment Workflow:</h3>
        <ol className={listClass}>
            <li><strong className={stepClass}>Processing Queue:</strong> This section shows all active warehouse orders that need action (e.g., picking, packing, dispatching).</li>
            <li><strong className={stepClass}>Creating a Dispatch:</strong> After an order is packed, create a dispatch record, filling in carrier details, tracking numbers, and assigning a <strong className={stepClass}>Broker</strong>.</li>
            <li><strong className={stepClass}>Broker Fee Entry:</strong> The assigned <span className={roleClass}>Broker</span> submits fees for the outbound shipment (duties, shipping, etc.).</li>
            <li><strong className={stepClass}>Finance Approval:</strong> The <span className={roleClass}>Finance</span> team reviews and approves the submitted fees.</li>
            <li><strong className={stepClass}>Broker Payment Confirmation:</strong> After approval, the <span className={roleClass}>Broker</span> confirms payment via the <strong className={stepClass}>"Confirm Payment"</strong> button. This action is crucial as it moves the shipment status to <code className={codeBlockClass}>In Transit</code>.</li>
            <li><strong className={stepClass}>Warehouse Delivery Confirmation:</strong> The <span className={roleClass}>Warehouse</span> team, Manager, or Admin will see a <strong className={stepClass}>"Mark as Delivered"</strong> button for any shipment that is "In Transit". They click this once the shipment reaches its final destination.</li>
             <li><strong className={stepClass}>Final Order Completion:</strong> After delivery, a <span className={roleClass}>Warehouse</span> user or manager can perform the final action of "Confirm Receipt" on the originating order, which moves its status to <code className={codeBlockClass}>Completed</code>.</li>
        </ol>
       
        {/* Asset Management Module */}
        <h2 className={sectionTitleClass}>Asset Management</h2>
        <p className={paragraphClass}>
          Track and manage your warehouse equipment, such as forklifts, scanners, and shelving units. Users like <span className={roleClass}>Technician</span> and <span className={roleClass}>Contractor</span> may have view access to maintenance logs.
        </p>
        <h3 className={subSectionTitleClass}>How to Manage Maintenance Logs:</h3>
        <ol className={listClass}>
          <li>In the Assets table, click the <strong className={stepClass}>Viewfinder Icon</strong> in the "Actions" column for the desired asset.</li>
          <li>The "Maintenance Log" modal will appear.
            <ul className={`${listClass} mt-1`}>
              <li>To add a new record: Fill in the form at the top and click <strong className={stepClass}>"Add Record"</strong>.</li>
              <li>To edit an existing record: Click the <strong className={stepClass}>Edit Icon</strong> next to a log entry, modify the form, and click <strong className={stepClass}>"Update Record"</strong>.</li>
            </ul>
          </li>
        </ol>
        
         {/* User Management Module */}
        <h2 className={sectionTitleClass}>User Management</h2>
        <p className={paragraphClass}>
          This section is available only to <span className={roleClass}>Admin</span> users and is used to manage all user accounts and their access levels within the application.
        </p>
        <h3 className={subSectionTitleClass}>How to Add a New User:</h3>
        <ol className={listClass}>
          <li>Navigate to "User Management" from the sidebar.</li>
          <li>Click the <strong className={stepClass}>"Add User"</strong> button.</li>
          <li>Fill in the user's <code className={codeBlockClass}>Name</code>, <code className={codeBlockClass}>Email</code>, and a temporary <code className={codeBlockClass}>Password</code>.</li>
          <li>Assign the user to a <strong className={stepClass}>User Group</strong> (e.g., Warehouse, Finance, Broker). This defines their primary role.</li>
          <li>Use the <strong className={stepClass}>Page Permissions</strong> checklist to grant access to specific pages. A user can only see pages in the sidebar if they have been granted permission here (Admins can see all pages).</li>
          <li>Click <strong className={stepClass}>"Create"</strong>.</li>
        </ol>
        <h3 className={subSectionTitleClass}>How to Edit a User:</h3>
        <ol className={listClass}>
            <li>Find the user in the table and click the <strong className={stepClass}>Edit Icon</strong> (Shield) in the "Actions" column.</li>
            <li>In the modal, you can change the user's <strong className={stepClass}>User Group</strong> and modify their <strong className={stepClass}>Page Permissions</strong>.</li>
            <li>Click <strong className={stepClass}>"Save Changes"</strong>.</li>
        </ol>
         <h3 className={subSectionTitleClass}>Other User Actions:</h3>
         <ul className={listClass}>
            <li><strong className={stepClass}>Activate/Deactivate:</strong> Temporarily enable or disable a user's account without deleting it.</li>
            <li><strong className={stepClass}>Reset Password:</strong> Force a password reset for a user. You will be prompted to enter a new temporary password for them.</li>
        </ul>

        {/* VisionBot AI Chatbot */}
        <h2 className={sectionTitleClass}>VisionBot AI Chatbot</h2>
        <p className={paragraphClass}>
          Your AI assistant for quick help and information directly within {APP_NAME}.
        </p>
        <h3 className={subSectionTitleClass}>How to Use VisionBot:</h3>
        <ol className={listClass}>
          <li>Click the <strong className={stepClass}>Chat Icon</strong> located at the bottom-right corner of the screen.</li>
          <li>Type your question about {APP_NAME} features, logistics concepts, or how to perform a task.</li>
          <li>Press Enter or click the <strong className={stepClass}>Send Icon (Paper Airplane)</strong>.</li>
        </ol>

        {/* AI-Powered Features */}
        <h2 className={sectionTitleClass}>AI-Powered Features</h2>
        <ul className={listClass}>
          <li><strong>VisionBot Chatbot:</strong> Ask logistics, inventory, or app usage questions. Try "How do I receive a shipment?" or "Show me items below reorder point."</li>
          <li><strong>AI Analytics:</strong> Use the reporting module to enter natural language queries (e.g., "Show inventory by category for last month").</li>
          <li><strong>Route Optimization:</strong> In Dispatch & Logistics, use AI to suggest optimal shipping routes based on constraints.</li>
          <li><strong>Inventory Forecasting:</strong> Predict stock needs and reorder points using historical data and trends.</li>
        </ul>
        <p className={paragraphClass}>AI features require a valid Gemini API key and may be limited by your user role.</p>

        {/* Tips & Best Practices */}
        <h2 className={sectionTitleClass}>Tips & Best Practices</h2>
        <ul className={listClass}>
          <li>Use filters and search bars to quickly find records in large tables.</li>
          <li>Check notifications regularly for important system or workflow updates.</li>
          <li>Admins should review user permissions after onboarding new users.</li>
          <li>Use the export feature in reports to save data as PDF or CSV for audits.</li>
          <li>For serialized items, scan barcodes where possible to avoid manual entry errors.</li>
        </ul>

        {/* Troubleshooting & FAQ */}
        <h2 className={sectionTitleClass}>Troubleshooting & FAQ</h2>
        <ul className={listClass}>
          <li><strong>Failed to fetch dynamically imported module?</strong> Reload the page. If the issue persists, clear your browser cache and ensure you are accessing the app via the correct URL (not file://).</li>
          <li><strong>Missing permissions?</strong> Contact your admin to review your assigned role and page permissions.</li>
          <li><strong>Can’t see a module in the sidebar?</strong> You may not have permission. Ask your admin to update your access.</li>
          <li><strong>Receiving errors on shipment or order actions?</strong> Double-check required fields and ensure you have the correct role for the action.</li>
          <li><strong>How do I reset my password?</strong> Use the "Forgot Password" link on the login page or ask an admin to reset it for you.</li>
        </ul>

        {/* Security & Compliance */}
        <h2 className={sectionTitleClass}>Security & Compliance</h2>
        <ul className={listClass}>
          <li>All data is encrypted in transit (HTTPS/SSL required in production).</li>
          <li>Role-based access ensures users only see and do what they are permitted.</li>
          <li>Audit logs track all critical actions for compliance and troubleshooting.</li>
          <li>Regularly update your password and never share credentials.</li>
          <li>Admins should periodically review user access and audit logs.</li>
        </ul>

        {/* Support & Feedback */}
        <h2 className={sectionTitleClass}>Support & Feedback</h2>
        <ul className={listClass}>
          <li>For technical support, contact your system administrator or IT helpdesk.</li>
          <li>For feature requests or bug reports, use the in-app feedback form or email the support team.</li>
          <li>Consult the README and in-app tooltips for additional guidance.</li>
        </ul>

        <p className={`${paragraphClass} mt-8`}>
          We hope this guide helps you make the most of {APP_NAME}! If you have further questions, try asking VisionBot.
        </p>
      </div>
    </PageContainer>
  );
};

export default HelpPage;
