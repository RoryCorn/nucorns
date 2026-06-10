const nodemailer = require("nodemailer");

let _transport = null;

function getTransport() {
  if (_transport !== null) return _transport;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) { _transport = false; return _transport; }
  _transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return _transport;
}

async function sendAdInquiryEmail({ company, contact, what, timing }) {
  const transport = getTransport();
  if (!transport) return; // email not configured — silently skip

  const timingLine = timing ? `<p><strong>Preferred timing:</strong> ${timing}</p>` : "";

  await transport.sendMail({
    from: `"nucorns ads" <${process.env.GMAIL_USER}>`,
    to: "rcorn88@gmail.com",
    subject: `New ad inquiry from ${company}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#FF7A1A">New advertising inquiry — nucorns</h2>
        <p><strong>Company / Brand:</strong> ${company}</p>
        <p><strong>Contact email:</strong> <a href="mailto:${contact}">${contact}</a></p>
        <p><strong>What they're advertising:</strong><br>${what}</p>
        ${timingLine}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#888;font-size:13px">
          Submitted via nucorns.com/advertising<br>
          Reply directly to <a href="mailto:${contact}">${contact}</a> to discuss pricing and campaign dates.
        </p>
      </div>
    `,
    replyTo: contact,
  });
}

async function sendCreativeFormEmail({ company, contact, token }) {
  const transport = getTransport();
  if (!transport) return;

  const origin = process.env.CLIENT_ORIGIN || "https://nucorns.com";
  const link = `${origin}/advertise/creative/${token}`;

  await transport.sendMail({
    from: `"nucorns ads" <${process.env.GMAIL_USER}>`,
    to: contact,
    subject: `Your nucorns ad is approved — submit your creative`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#FF7A1A">Your ad inquiry has been approved!</h2>
        <p>Hi ${company} team,</p>
        <p>Great news — the nucorns team has approved your advertising inquiry. You're one step away from going live.</p>
        <p><strong>Use the link below to submit your ad creative</strong> — your headline, description, image or video, and the URL you'd like to send people to.</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#119cf0;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;font-size:15px">Submit your ad creative →</a>
        </p>
        <p style="color:#888;font-size:13px">This link is unique to your campaign. Once you submit, the nucorns team will review your creative and place your ad.</p>
        <p style="color:#888;font-size:13px">Questions? Reply to this email and we'll get back to you.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#aaa;font-size:12px">nucorns · advertising that respects the room</p>
      </div>
    `,
  });
}

module.exports = { sendAdInquiryEmail, sendCreativeFormEmail };
