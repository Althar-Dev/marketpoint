/**
 * MarketPointID Security Email Template
 * Renders HTML email for 2FA / Password Reset Verification Code
 * Sent from no-reply@marketpoint.id
 */

export interface VerificationEmailParams {
  code: string;
  email: string;
  type?: "change_password" | "add_email" | "verify_email";
  expiresMinutes?: number;
}

export function renderVerificationCodeEmailHtml({
  code,
  email,
  type = "change_password",
  expiresMinutes = 10,
}: VerificationEmailParams): string {
  const isAddEmail = type === "add_email" || type === "verify_email";
  const title = isAddEmail ? "Kode Verifikasi Penambahan Email" : "Kode Verifikasi Ubah Kata Sandi";
  const desc = isAddEmail
    ? `Kami menerima permintaan untuk menambahkan atau menghubungkan alamat email <strong style="color: #0f172a;">${email}</strong> ke akun MarketPointID Anda. Gunakan kode verifikasi di bawah ini untuk mengonfirmasi kepemilikan email:`
    : `Kami menerima permintaan untuk mengubah kata sandi akun MarketPointID yang terhubung dengan email <strong style="color: #0f172a;">${email}</strong>.`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} MarketPointID</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px; font-weight: 800; color: #00AA5B; letter-spacing: -0.5px;">MarketPoint<span style="color: #0f172a;">ID</span></span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #00AA5B; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${isAddEmail ? "Verifikasi Email" : "Keamanan Akun"}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                ${title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 13.5px; color: #64748b; line-height: 1.6;">
                ${desc}
              </p>

              <!-- Verification Code Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%); border: 1.5px solid #86efac; border-radius: 12px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.1em;">
                  Kode Verifikasi Anda
                </p>
                <div style="display: inline-block; font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a; padding: 4px 0;">
                  ${code}
                </div>
                <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
                  Berlaku selama <strong style="color: #0f172a;">${expiresMinutes} menit</strong>
                </p>
              </div>

              <!-- Security Caution Box -->
              <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="top" style="width: 20px; padding-right: 10px; font-size: 16px;">
                      ⚠️
                    </td>
                    <td style="font-size: 12px; color: #991b1b; line-height: 1.5;">
                      <strong>Perhatian Keamanan:</strong> Jangan pernah membagikan kode verifikasi ini kepada siapa pun, termasuk pihak yang mengatasnamakan MarketPointID. Tim kami tidak pernah meminta kode keamanan Anda.
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
                Jika Anda tidak merasa melakukan permintaan ini, segera abaikan email ini atau amankan akun Anda melalui dashboard MarketPointID.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">
                Email ini dikirim secara otomatis oleh sistem keamanan MarketPointID dari <span style="font-weight: 600; color: #0f172a;">no-reply@marketpoint.id</span>.
              </p>
              <p style="margin: 0; font-size: 10.5px; color: #94a3b8;">
                © ${new Date().getFullYear()} MarketPointID • StarVale Technology Solution. Seluruh hak cipta dilindungi.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
