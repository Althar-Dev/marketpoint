/**
 * MarketPointID Security Email Template
 * Renders high-converting, premium HTML email for OTP / Verification Codes
 * Sent officially from no-reply@marketpoint.id
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
  const badgeLabel = isAddEmail ? "Verifikasi Email" : "Keamanan Akun";
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
    ? `Kami menerima permintaan untuk menambahkan atau menghubungkan alamat email <strong style="color: #0f172a; word-break: break-all;">${email}</strong> ke akun MarketPointID Anda. Masukkan kode verifikasi 6 digit di bawah ini untuk mengonfirmasi kepemilikan:`
    : `Kami menerima permintaan untuk mengubah kata sandi akun MarketPointID yang terhubung dengan email <strong style="color: #0f172a; word-break: break-all;">${email}</strong>. Masukkan kode verifikasi 6 digit di bawah ini untuk melanjutkan:`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} - MarketPointID</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.5;">

  <!-- Outer Wrapper Table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);">
          
          <!-- Top Accent Brand Stripe -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #00AA5B 0%, #10B981 50%, #059669 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header with Official Logo -->
          <tr>
            <td style="padding: 24px 32px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Logo & Brand Name -->
                  <td style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img 
                            src="https://marketpoint.id/assets/img/logo.png" 
                            alt="MarketPointID" 
                            width="40" 
                            height="40" 
                            style="display: block; width: 40px; height: 40px; border-radius: 10px; object-fit: contain; border: 0;"
                          />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 19px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -0.5px;">
                            MarketPoint<span style="color: #00AA5B;">ID</span>
                          </div>
                          <div style="font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">
                            Pusat Keamanan Akun
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Security Badge -->
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #00AA5B; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;">
                      ${badgeLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              
              <!-- Title -->
              <h1 style="margin: 0 0 14px; font-size: 21px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.3px;">
                ${title}
              </h1>

              <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
                ${desc}
              </p>

              <!-- Verification Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #ffffff 100%); border: 1.5px solid #86efac; border-radius: 14px; padding: 26px 20px; text-align: center; box-shadow: inset 0 1px 2px rgba(0, 170, 91, 0.05);">
                    <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;">
                      Kode Verifikasi Keamanan (OTP)
                    </div>
                    
                    <!-- 6-digit Code Display -->
                    <div style="display: inline-block; font-family: 'SF Mono', Consolas, Menlo, Monaco, 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #065f46; background-color: #ffffff; padding: 8px 20px 8px 30px; border-radius: 10px; border: 1px solid #bbf7d0; box-shadow: 0 2px 4px rgba(4, 120, 87, 0.06); text-align: center; margin: 4px 0 10px;">
                      ${code}
                    </div>

                    <div style="font-size: 12px; color: #475569; margin-top: 6px;">
                      Kode ini berlaku selama <strong style="color: #0f172a;">${expiresMinutes} menit</strong> (hingga <strong style="color: #0f172a;">${expireTimeStr}</strong>)
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Request Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; font-size: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 38%;">
                    Jenis Permintaan
                  </td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">
                    ${requestTypeLabel}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Alamat Email
                  </td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right; word-break: break-all;">
                    ${email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Waktu Pengiriman
                  </td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">
                    ${requestTimeStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b;">
                    Pengirim Resmi
                  </td>
                  <td style="padding: 10px 14px; color: #00AA5B; font-weight: 700; text-align: right;">
                    no-reply@marketpoint.id
                  </td>
                </tr>
              </table>

              <!-- Security Caution Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                <tr>
                  <td valign="top" style="width: 24px; padding-right: 10px; font-size: 16px; line-height: 1.2;">
                    🔒
                  </td>
                  <td style="font-size: 12px; color: #92400e; line-height: 1.55;">
                    <strong style="color: #78350f;">Penting untuk Keamanan Anda:</strong><br>
                    Jangan pernah membagikan kode verifikasi ini kepada siapa pun. Tim resmi MarketPointID <strong>tidak pernah</strong> meminta kode OTP, kata sandi, ataupun PIN melalui media sosial, WhatsApp, atau telepon.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dengan aman. Akun Anda tidak akan berubah tanpa memasukkan kode di atas.
              </p>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              
              <!-- Mini Footer Brand -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 10px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 8px;">
                    <img 
                      src="https://marketpoint.id/assets/img/logo.png" 
                      alt="Logo" 
                      width="20" 
                      height="20" 
                      style="display: block; width: 20px; height: 20px; border-radius: 4px; object-fit: contain;" 
                    />
                  </td>
                  <td style="vertical-align: middle; font-size: 13px; font-weight: 800; color: #334155;">
                    MarketPoint<span style="color: #00AA5B;">ID</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; line-height: 1.5;">
                Pemberitahuan otomatis keamanan akun MarketPointID • Dikirim secara aman dari <strong style="color: #0f172a;">no-reply@marketpoint.id</strong>
              </p>
              
              <p style="margin: 0; font-size: 10.5px; color: #94a3b8; line-height: 1.5;">
                © ${now.getFullYear()} MarketPointID • PT StarVale Technology Solution. Seluruh hak cipta dilindungi undang-undang.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

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
  const deviceIcon = deviceType === "mobile" ? "📱" : deviceType === "tablet" ? "📟" : "💻";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pemberitahuan Keamanan: Login Perangkat Baru - MarketPointID</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.5;">

  <!-- Outer Wrapper Table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);">
          
          <!-- Top Accent Stripe (Amber into Green) -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #f59e0b 0%, #00AA5B 50%, #10B981 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header with Official Logo -->
          <tr>
            <td style="padding: 24px 32px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Logo & Brand Name -->
                  <td style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img 
                            src="https://marketpoint.id/assets/img/logo.png" 
                            alt="MarketPointID" 
                            width="40" 
                            height="40" 
                            style="display: block; width: 40px; height: 40px; border-radius: 10px; object-fit: contain; border: 0;"
                          />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 19px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -0.5px;">
                            MarketPoint<span style="color: #00AA5B;">ID</span>
                          </div>
                          <div style="font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">
                            Pusat Keamanan Akun
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Security Badge -->
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #b45309; background-color: #fef3c7; border: 1px solid #fde68a; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;">
                      Perangkat Baru
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              
              <!-- Title -->
              <h1 style="margin: 0 0 14px; font-size: 21px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.3px;">
                Login Terdeteksi di Perangkat Baru
              </h1>

              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
                Halo <strong style="color: #0f172a;">${displayName}</strong>, kami mendeteksi adanya aktivitas login ke akun MarketPointID Anda menggunakan perangkat baru yang belum pernah Anda gunakan sebelumnya.
              </p>

              <!-- Device Specification Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px; font-size: 13px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 12px 16px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.08em;">
                    ${deviceIcon} Informasi Perangkat & Sesi Login
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 38%;">
                    Nama Perangkat
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: right;">
                    ${deviceName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Browser
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">
                    ${browser}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Sistem Operasi
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">
                    ${os}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Perkiraan Lokasi
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">
                    📍 ${location}
                  </td>
                </tr>
                ${ipAddress ? `
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Alamat IP
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right; font-family: monospace;">
                    ${ipAddress}
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 11px 16px; color: #64748b;">
                    Waktu Login
                  </td>
                  <td style="padding: 11px 16px; color: #0f172a; font-weight: 600; text-align: right;">
                    ${activityTimeStr}
                  </td>
                </tr>
              </table>

              <!-- Action Scenarios -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; margin-bottom: 12px;">
                    <div style="font-size: 12.5px; font-weight: 700; color: #065f46; margin-bottom: 2px;">
                      ✓ Apakah ini Anda?
                    </div>
                    <div style="font-size: 12px; color: #047857; line-height: 1.5;">
                      Jika aktivitas login di atas dilakukan oleh Anda, Anda tidak perlu melakukan tindakan apa pun. Perangkat ini telah ditambahkan ke daftar perangkat terpercaya Anda.
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;">
                    <div style="font-size: 12.5px; font-weight: 700; color: #991b1b; margin-bottom: 2px;">
                      ⚠️ Bukan Anda? Segera Amankan Akun!
                    </div>
                    <div style="font-size: 12px; color: #b91c1c; line-height: 1.5; margin-bottom: 14px;">
                      Jika Anda tidak mengenali perangkat ini, segera putuskan sesi login tersebut dan ubah kata sandi akun Anda untuk mencegah akses yang tidak sah.
                    </div>
                    
                    <!-- Action Buttons -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                      <tr>
                        <td align="left" style="padding-right: 8px;">
                          <a 
                            href="https://marketpoint.id/settings/devices" 
                            style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 700; text-decoration: none; padding: 9px 16px; border-radius: 8px; text-align: center;"
                          >
                            Kelola & Putuskan Perangkat
                          </a>
                        </td>
                        <td align="right">
                          <a 
                            href="https://marketpoint.id/settings/security/change-password" 
                            style="display: inline-block; background-color: #ffffff; color: #334155; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 14px; border-radius: 8px; text-align: center;"
                          >
                            Ubah Kata Sandi
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Safety Guarantee Note -->
              <p style="margin: 0; font-size: 11.5px; color: #94a3b8; line-height: 1.6;">
                MarketPointID tidak pernah meminta kode OTP, kata sandi, atau data pribadi Anda melalui telepon, SMS, ataupun aplikasi perpesanan instan.
              </p>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              
              <!-- Mini Footer Brand -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 10px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 8px;">
                    <img 
                      src="https://marketpoint.id/assets/img/logo.png" 
                      alt="Logo" 
                      width="20" 
                      height="20" 
                      style="display: block; width: 20px; height: 20px; border-radius: 4px; object-fit: contain;" 
                    />
                  </td>
                  <td style="vertical-align: middle; font-size: 13px; font-weight: 800; color: #334155;">
                    MarketPoint<span style="color: #00AA5B;">ID</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; line-height: 1.5;">
                Pemberitahuan otomatis keamanan akun MarketPointID • Dikirim secara aman dari <strong style="color: #0f172a;">no-reply@marketpoint.id</strong>
              </p>
              
              <p style="margin: 0; font-size: 10.5px; color: #94a3b8; line-height: 1.5;">
                © ${now.getFullYear()} MarketPointID • PT StarVale Technology Solution. Seluruh hak cipta dilindungi undang-undang.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

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

  let title = "Pemberitahuan Perubahan Keamanan Akun";
  let badgeLabel = "Keamanan Akun";
  let iconEmoji = "🔒";
  let mainDesc = "";
  let detailLabel = "";
  let detailVal = "";
  let actionLink = "https://marketpoint.id/settings/security";
  let actionText = "Periksa Keamanan Akun";

  if (eventType === "password_changed") {
    title = "Kata Sandi Berhasil Diperbarui";
    badgeLabel = "Kata Sandi";
    iconEmoji = "🔑";
    mainDesc = `Kata sandi untuk akun MarketPointID Anda (<strong style="color: #0f172a;">${email}</strong>) telah berhasil diubah. Jika Anda merasa melakukan perubahan ini, Anda dapat mengabaikan email ini.`;
    detailLabel = "Jenis Aktivitas";
    detailVal = "Pembaruan Kata Sandi Akun";
    actionLink = "https://marketpoint.id/settings/security/change-password";
    actionText = "Reset Kata Sandi Baru";
  } else if (eventType === "pin_changed") {
    title = "PIN Transaksi Berhasil Diatur / Diubah";
    badgeLabel = "PIN Transaksi";
    iconEmoji = "🛡️";
    mainDesc = `PIN 6 digit MarketPoint untuk keamanan dompet dan transaksi akun Anda (<strong style="color: #0f172a;">${email}</strong>) telah berhasil diperbarui. Selalu jaga kerahasiaan PIN Anda.`;
    detailLabel = "Jenis Aktivitas";
    detailVal = "Pengaturan / Perubahan PIN Transaksi";
    actionLink = "https://marketpoint.id/settings/security";
    actionText = "Pengaturan Keamanan Akun";
  } else if (eventType === "phone_changed") {
    title = "Nomor Handphone Berhasil Diperbarui";
    badgeLabel = "Kontak Akun";
    iconEmoji = "📱";
    mainDesc = `Nomor handphone pada akun MarketPointID Anda (<strong style="color: #0f172a;">${email}</strong>) telah berhasil diperbarui${newValue ? ` menjadi <strong style="color: #0f172a;">${newValue}</strong>` : ""}. Nomor ini digunakan untuk konfirmasi transaksi dan kurir.`;
    detailLabel = "Nomor Baru";
    detailVal = newValue || "Nomor Handphone Terdaftar";
    actionLink = "https://marketpoint.id/settings/profile";
    actionText = "Periksa Profil & Kontak";
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} - MarketPointID</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.5;">

  <!-- Outer Wrapper Table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);">
          
          <!-- Top Accent Stripe -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #00AA5B 0%, #10B981 50%, #059669 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header with Official Logo -->
          <tr>
            <td style="padding: 24px 32px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Logo & Brand Name -->
                  <td style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img 
                            src="https://marketpoint.id/assets/img/logo.png" 
                            alt="MarketPointID" 
                            width="40" 
                            height="40" 
                            style="display: block; width: 40px; height: 40px; border-radius: 10px; object-fit: contain; border: 0;"
                          />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 19px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -0.5px;">
                            MarketPoint<span style="color: #00AA5B;">ID</span>
                          </div>
                          <div style="font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">
                            Pusat Keamanan Akun
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Security Badge -->
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #00AA5B; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;">
                      ${badgeLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              
              <!-- Title -->
              <h1 style="margin: 0 0 14px; font-size: 21px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.3px;">
                ${title}
              </h1>

              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
                Halo <strong style="color: #0f172a;">${displayName}</strong>,
              </p>

              <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
                ${mainDesc}
              </p>

              <!-- Activity Detail Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px; font-size: 13px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 12px 16px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.08em;">
                    ${iconEmoji} Rincian Aktivitas Akun
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;">
                    ${detailLabel}
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: right;">
                    ${detailVal}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Alamat Email Akun
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right; word-break: break-all;">
                    ${email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                    Waktu Perubahan
                  </td>
                  <td style="padding: 11px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">
                    ${activityTimeStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; color: #64748b;">
                    Pengirim Resmi
                  </td>
                  <td style="padding: 11px 16px; color: #00AA5B; font-weight: 700; text-align: right;">
                    no-reply@marketpoint.id
                  </td>
                </tr>
              </table>

              <!-- Safety Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <td valign="top" style="width: 24px; padding-right: 10px; font-size: 16px; line-height: 1.2;">
                    ⚠️
                  </td>
                  <td style="font-size: 12px; color: #991b1b; line-height: 1.55;">
                    <strong style="color: #7f1d1d;">Bukan Anda yang Melakukan Perubahan Ini?</strong><br>
                    Jika Anda merasa tidak pernah melakukan tindakan ini, akun Anda mungkin berada dalam risiko. Segera amankan akun Anda atau hubungi pusat bantuan resmi kami.
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <a 
                      href="${actionLink}" 
                      style="display: inline-block; background-color: #00AA5B; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 11px 24px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0, 170, 91, 0.2);"
                    >
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              
              <!-- Mini Footer Brand -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 10px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 8px;">
                    <img 
                      src="https://marketpoint.id/assets/img/logo.png" 
                      alt="Logo" 
                      width="20" 
                      height="20" 
                      style="display: block; width: 20px; height: 20px; border-radius: 4px; object-fit: contain;" 
                    />
                  </td>
                  <td style="vertical-align: middle; font-size: 13px; font-weight: 800; color: #334155;">
                    MarketPoint<span style="color: #00AA5B;">ID</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; line-height: 1.5;">
                Pemberitahuan otomatis keamanan akun MarketPointID • Dikirim secara aman dari <strong style="color: #0f172a;">no-reply@marketpoint.id</strong>
              </p>
              
              <p style="margin: 0; font-size: 10.5px; color: #94a3b8; line-height: 1.5;">
                © ${now.getFullYear()} MarketPointID • PT StarVale Technology Solution. Seluruh hak cipta dilindungi undang-undang.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}


