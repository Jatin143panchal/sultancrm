// services/emailService.ts
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
}

export const sendTaskAssignmentEmail = async (emailData: {
  to: string;
  taskName: string;
  projectName: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  taskLink: string;
}) => {
  try {
    // Using Supabase Edge Function for email sending
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.to,
        subject: `📋 New Task Assigned: ${emailData.taskName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .task-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4F46E5; }
              .button { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
              .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🎯 New Task Assignment</h2>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p><strong>${emailData.assignedBy}</strong> has assigned you a new task:</p>
                
                <div class="task-details">
                  <h3 style="margin-top: 0;">${emailData.taskName}</h3>
                  <p><strong>Project:</strong> ${emailData.projectName}</p>
                  ${emailData.description ? `<p><strong>Description:</strong> ${emailData.description}</p>` : ''}
                  <p><strong>Due Date:</strong> ${new Date(emailData.dueDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</p>
                </div>
                
                <p style="text-align: center; margin: 20px 0;">
                  <a href="${emailData.taskLink}" class="button">View Task Details</a>
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                  💡 You can also view and manage this task from the Banega Brand dashboard.
                </p>
              </div>
              <div class="footer">
                <p>This is an automated notification from Banega Brand Project Management System.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Alternative: Using SMTP directly (if you have nodemailer configured)
export const sendEmailSMTP = async (config: EmailConfig) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email-smtp', {
      body: config
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};