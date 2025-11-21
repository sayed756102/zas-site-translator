import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl }: VerificationEmailRequest = await req.json();

    console.log("Sending verification email to:", email);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ZAS <onboarding@resend.dev>",
        to: [email],
        subject: "تأكيد بريدك الإلكتروني - Email Verification",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: right; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 36px; margin: 0; font-weight: bold;">ZAS</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 5px;">منصة الترجمة الذكية للأكواد البرمجية</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 24px;">مرحباً بك!</h2>
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">
                نشكرك على انضمامك إلى ZAS. لإكمال عملية التسجيل، يرجى تأكيد بريدك الإلكتروني.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                تأكيد البريد الإلكتروني
              </a>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                <strong>ملاحظة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط. إذا لم تقم بالتسجيل في ZAS، يمكنك تجاهل هذا البريد.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <div dir="ltr" style="text-align: left;">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 24px;">Welcome!</h2>
                <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">
                  Thank you for joining ZAS. To complete your registration, please verify your email address.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" 
                   style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                  Verify Email
                </a>
              </div>

              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>Note:</strong> This link is valid for 24 hours only. If you didn't sign up for ZAS, you can safely ignore this email.
                </p>
              </div>
            </div>

            <div style="text-align: center; padding-top: 20px; border-top: 2px solid #e2e8f0; margin-top: 30px;">
              <p style="color: #64748b; font-size: 12px; margin: 5px 0;">
                © 2024 ZAS - منصة الترجمة الذكية
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 5px 0;">
                Code Translation Platform
              </p>
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
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
