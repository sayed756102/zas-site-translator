import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
}

interface WebhookPayload {
  user: {
    email: string;
    id: string;
  };
  email_data: EmailData;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { user, email_data } = payload;
    
    console.log("Processing verification email for:", user.email);

    const confirmationUrl = `${email_data.site_url}/auth/confirm?token_hash=${email_data.token_hash}&type=email&redirect_to=${encodeURIComponent(email_data.redirect_to || email_data.site_url)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td align="center" style="padding: 40px 20px 20px 20px;">
                    <img src="https://dgxxggjxbhjarswomkjg.supabase.co/storage/v1/object/public/assets/logo.png" alt="ZAS Logo" style="width: 120px; height: auto; margin-bottom: 20px;" />
                    <h1 style="color: #2563eb; font-size: 36px; margin: 0; font-weight: bold;">ZAS</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 5px;">منصة الترجمة الذكية للأكواد البرمجية</p>
                  </td>
                </tr>

                <!-- Arabic Content -->
                <tr>
                  <td style="padding: 20px 40px; text-align: right;">
                    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                      <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 24px;">مرحباً بك في ZAS!</h2>
                      <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">
                        شكراً لتسجيلك في منصة ZAS لترجمة الأكواد البرمجية. للمتابعة، يرجى تأكيد عنوان بريدك الإلكتروني.
                      </p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${confirmationUrl}" 
                         style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                                color: #ffffff; 
                                text-decoration: none; 
                                padding: 15px 40px; 
                                border-radius: 8px; 
                                font-size: 16px; 
                                font-weight: bold; 
                                display: inline-block;
                                box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                        تأكيد البريد الإلكتروني
                      </a>
                    </div>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                      إذا لم تقم بإنشاء حساب في ZAS، يمكنك تجاهل هذه الرسالة بأمان.
                    </p>

                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-right: 4px solid #2563eb; margin: 20px 0;">
                      <p style="color: #475569; font-size: 13px; margin: 0; line-height: 1.5;">
                        💡 <strong>نصيحة:</strong> رابط التأكيد صالح لمدة محدودة. إذا انتهت صلاحيته، يمكنك طلب رابط جديد من صفحة تسجيل الدخول.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  </td>
                </tr>

                <!-- English Content -->
                <tr>
                  <td style="padding: 20px 40px; text-align: left;" dir="ltr">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <img src="https://dgxxggjxbhjarswomkjg.supabase.co/storage/v1/object/public/assets/logo.png" alt="ZAS Logo" style="width: 120px; height: auto; margin-bottom: 15px;" />
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                      <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 24px;">Welcome to ZAS!</h2>
                      <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">
                        Thank you for signing up for ZAS Code Translation Platform. To continue, please confirm your email address.
                      </p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${confirmationUrl}" 
                         style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                                color: #ffffff; 
                                text-decoration: none; 
                                padding: 15px 40px; 
                                border-radius: 8px; 
                                font-size: 16px; 
                                font-weight: bold; 
                                display: inline-block;
                                box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                        Confirm Email
                      </a>
                    </div>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                      If you didn't create an account with ZAS, you can safely ignore this message.
                    </p>

                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
                      <p style="color: #475569; font-size: 13px; margin: 0; line-height: 1.5;">
                        💡 <strong>Tip:</strong> This confirmation link is valid for a limited time. If it expires, you can request a new one from the login page.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 30px 20px; border-top: 2px solid #e2e8f0;">
                    <img src="https://dgxxggjxbhjarswomkjg.supabase.co/storage/v1/object/public/assets/logo.png" alt="ZAS Logo" style="width: 60px; height: auto; margin-bottom: 10px;" />
                    <p style="color: #64748b; font-size: 12px; margin: 5px 0;">
                      © 2025 ZAS - منصة الترجمة الذكية
                    </p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 5px 0;">
                      Code Translation Platform
                    </p>
                    <p style="color: #cbd5e1; font-size: 10px; margin: 15px 0 0 0;">
                      <a href="https://zas-site-translator.vercel.app" style="color: #2563eb; text-decoration: none;">Visit Website</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ZAS <onboarding@resend.dev>",
        to: [user.email],
        subject: "تأكيد البريد الإلكتروني - ZAS Email Confirmation",
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error sending email:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-custom-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
