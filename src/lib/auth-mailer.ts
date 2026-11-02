/**
 * MarketPointID Security Email Template
 * Clean, compact, and professional responsive HTML email templates
 * Optimized typography and balanced font sizes for mobile and desktop
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
  const requestTypeLabel = isAddEmail ? "Penambahan Alamat Email" : "Reset Kata Sandi Akun";

  // Format Indonesian Time (WIB)
  const now = new Date();
  const expireDate = new Date(now.getTime() + expiresMinutes * 60 * 1000);

  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const requestTimeStr = `${dateFormatter.format(now)}, ${timeFormatter.format(now)} WIB`;
  const expireTimeStr = `${timeFormatter.format(expireDate)} WIB`;

  const desc = isAddEmail
    ? `Kami menerima permintaan untuk menghubungkan alamat email <strong style="color: #0f172a; word-break: break-all;">${email}</strong> ke akun MarketPointID Anda. Gunakan kode verifikasi di bawah ini:`
    : `Kami menerima permintaan untuk mengubah kata sandi akun MarketPointID yang terhubung dengan email <strong style="color: #0f172a; word-break: break-all;">${email}</strong>. Gunakan kode verifikasi di bawah ini:`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - MarketPointID</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 18px 14px !important;
      }
      .otp-code {
        font-size: 24px !important;
        letter-spacing: 4px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 12px 0 32px;">
        
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 490px; margin: 0 auto; padding: 20px 18px; text-align: left;">
          
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 18px; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 9px;">
                    <img 
                      src="https://marketpoint.id/assets/img/logo.png" 
                      alt="MarketPointID" 
                      width="26" 
                      height="26" 
                      style="display: block; width: 26px; height: 26px; object-fit: contain;"
                    />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;">
                      MarketPoint<span style="color: #00AA5B;">ID</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding-top: 22px;">
              <h1 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                ${title}
              </h1>

              <p style="margin: 0 0 18px; font-size: 13px; color: #475569; line-height: 1.55;">
                ${desc}
              </p>

              <!-- Compact & Elegant OTP Display Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 16px; text-align: center; margin: 18px 0;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px;">
                  Kode Verifikasi (OTP)
                </div>
                <div class="otp-code" style="font-family: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 27px; font-weight: 800; letter-spacing: 6px; color: #00AA5B; margin: 6px 0;">
                  ${code}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  Berlaku selama <strong style="color: #0f172a;">${expiresMinutes} menit</strong> (hingga ${expireTimeStr})
                </div>
              </div>

              <!-- Rincian Permintaan Ringkas -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px; border-top: 1px solid #f1f5f9; padding-top: 12px; font-size: 12px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; width: 40%;">Jenis Permintaan</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${requestTypeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Alamat Email</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right; word-break: break-all;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Waktu Permintaan</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${requestTimeStr}</td>
                </tr>
              </table>

              <!-- Keamanan Info -->
              <div style="margin-top: 18px; padding: 10px 14px; background-color: #fffbeb; border-radius: 8px; font-size: 11.5px; color: #92400e; line-height: 1.5;">
                <strong>Penting:</strong> Jangan bagikan kode ini kepada siapa pun. Tim MarketPointID tidak pernah meminta kode verifikasi atau kata sandi Anda.
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 10.5px; color: #94a3b8; line-height: 1.5;">
                  Email ini dibuat secara otomatis. Mohon untuk tidak membalas email ini.
                </p>
                <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.5;">
                  © ${now.getFullYear()} MarketPointID. Seluruh hak cipta dilindungi undang-undang.
                </p>
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

export interface NewDeviceAlertEmailParams {
  email: string;
  displayName?: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  location: string;
  ipAddress?: string;
  loginTime?: string;
}

export function renderNewDeviceAlertEmailHtml({
  email,
  displayName = "Pengguna",
  deviceName,
  browser,
  os,
  deviceType = "desktop",
  location,
  ipAddress,
  loginTime,
}: NewDeviceAlertEmailParams): string {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activityTimeStr = loginTime || `${dateFormatter.format(now)}, ${timeFormatter.format(now)} WIB`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login di Perangkat Baru Terdeteksi - MarketPointID</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 18px 14px !important;
      }
      .action-btn {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8px !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 12px 0 32px;">
        
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 490px; margin: 0 auto; padding: 20px 18px; text-align: left;">
          
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 18px; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 9px;">
                    <img 
                      src="https://marketpoint.id/assets/img/logo.png" 
                      alt="MarketPointID" 
                      width="26" 
                      height="26" 
                      style="display: block; width: 26px; height: 26px; object-fit: contain;"
                    />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;">
                      MarketPoint<span style="color: #00AA5B;">ID</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding-top: 22px;">
              <h1 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                Login di Perangkat Baru Terdeteksi
              </h1>

              <p style="margin: 0 0 16px; font-size: 13px; color: #475569; line-height: 1.55;">
                Halo <strong style="color: #0f172a;">${displayName}</strong>, kami mendeteksi aktivitas login ke akun Anda menggunakan perangkat baru:
              </p>

              <!-- Device Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; width: 40%;">Perangkat</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${deviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Browser / OS</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${browser} • ${os}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Perkiraan Lokasi</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">📍 ${location}</td>
                </tr>
                ${ipAddress ? `
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Alamat IP</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right; font-family: monospace;">${ipAddress}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Waktu Login</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${activityTimeStr}</td>
                </tr>
              </table>

              <!-- Action Notice -->
              <p style="margin: 0 0 14px; font-size: 12.5px; color: #475569; line-height: 1.55;">
                Jika aktivitas di atas dilakukan oleh Anda, Anda tidak perlu melakukan tindakan apa pun. Namun jika Anda <strong>tidak mengenali</strong> perangkat ini, segera amankan akun Anda:
              </p>

              <div style="margin: 16px 0 22px;">
                <a 
                  href="https://marketpoint.id/settings/devices" 
                  class="action-btn"
                  style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 7px; margin-right: 8px;"
                >
                  Kelola & Putuskan Perangkat
                </a>
                <a 
                  href="https://marketpoint.id/settings/security/change-password" 
                  class="action-btn"
                  style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; text-decoration: none; padding: 8px 14px; border-radius: 7px;"
                >
                  Ubah Kata Sandi
                </a>
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 10.5px; color: #94a3b8; line-height: 1.5;">
                  Email ini dibuat secara otomatis. Mohon untuk tidak membalas email ini.
                </p>
                <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.5;">
                  © ${now.getFullYear()} MarketPointID. Seluruh hak cipta dilindungi undang-undang.
                </p>
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

export interface SecurityAlertEmailParams {
  email: string;
  displayName?: string;
  eventType: "password_changed" | "pin_changed" | "phone_changed";
  newValue?: string;
  changeTime?: string;
}

export function renderSecurityAlertEmailHtml({
  email,
  displayName = "Pengguna",
  eventType,
  newValue,
  changeTime,
}: SecurityAlertEmailParams): string {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activityTimeStr = changeTime || `${dateFormatter.format(now)}, ${timeFormatter.format(now)} WIB`;

  let title = "Pemberitahuan Keamanan Akun";
  let mainDesc = "";
  let detailLabel = "Jenis Aktivitas";
  let detailVal = "";
  let actionLink = "https://marketpoint.id/settings/security";
  let actionText = "Periksa Keamanan Akun";

  if (eventType === "password_changed") {
    title = "Kata Sandi Berhasil Diperbarui";
    mainDesc = `Kata sandi untuk akun MarketPointID Anda (${email}) telah berhasil diperbarui. Jika Anda melakukan perubahan ini, Anda dapat mengabaikan email ini.`;
    detailVal = "Pembaruan Kata Sandi Akun";
    actionLink = "https://marketpoint.id/settings/security/change-password";
    actionText = "Ubah Kata Sandi Baru";
  } else if (eventType === "pin_changed") {
    title = "PIN Transaksi Berhasil Diatur";
    mainDesc = `PIN 6 digit MarketPoint untuk keamanan transaksi akun Anda (${email}) telah berhasil diperbarui. Selalu jaga kerahasiaan PIN Anda.`;
    detailVal = "Pengaturan PIN Transaksi";
    actionLink = "https://marketpoint.id/settings/security";
    actionText = "Pengaturan Keamanan";
  } else if (eventType === "phone_changed") {
    title = "Nomor Handphone Berhasil Diperbarui";
    mainDesc = `Nomor handphone yang terhubung ke akun MarketPointID Anda (${email}) telah diperbarui menjadi ${newValue || "baru"}.`;
    detailVal = "Pembaruan Nomor Handphone";
    actionLink = "https://marketpoint.id/settings/profile";
    actionText = "Lihat Profil Akun";
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - MarketPointID</title>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 18px 14px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 12px 0 32px;">
        
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 490px; margin: 0 auto; padding: 20px 18px; text-align: left;">
          
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 18px; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 9px;">
                    <img 
                      src="https://marketpoint.id/assets/img/logo.png" 
                      alt="MarketPointID" 
                      width="26" 
                      height="26" 
                      style="display: block; width: 26px; height: 26px; object-fit: contain;"
                    />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;">
                      MarketPoint<span style="color: #00AA5B;">ID</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding-top: 22px;">
              <h1 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                ${title}
              </h1>

              <p style="margin: 0 0 14px; font-size: 13px; color: #475569; line-height: 1.55;">
                Halo <strong style="color: #0f172a;">${displayName}</strong>,
              </p>

              <p style="margin: 0 0 18px; font-size: 13px; color: #475569; line-height: 1.55;">
                ${mainDesc}
              </p>

              <!-- Activity Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; width: 40%;">${detailLabel}</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${detailVal}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Alamat Email Akun</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right; word-break: break-all;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Waktu Perubahan</td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: 600; text-align: right;">${activityTimeStr}</td>
                </tr>
              </table>

              <!-- Warning Callout -->
              <div style="margin: 16px 0 20px; padding: 10px 14px; background-color: #fef2f2; border-radius: 8px; font-size: 11.5px; color: #991b1b; line-height: 1.5;">
                <strong>Bukan Anda yang melakukan perubahan ini?</strong> Akun Anda mungkin dalam risiko. Segera amankan akun Anda atau periksa pengaturan keamanan.
              </div>

              <!-- Action Button -->
              <div style="margin: 18px 0 26px;">
                <a 
                  href="${actionLink}" 
                  style="display: inline-block; background-color: #00AA5B; color: #ffffff; font-size: 12px; font-weight: 700; text-decoration: none; padding: 9px 18px; border-radius: 7px;"
                >
                  ${actionText}
                </a>
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 10.5px; color: #94a3b8; line-height: 1.5;">
                  Email ini dibuat secara otomatis. Mohon untuk tidak membalas email ini.
                </p>
                <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.5;">
                  © ${now.getFullYear()} MarketPointID. Seluruh hak cipta dilindungi undang-undang.
                </p>
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
