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

module.exports = { sendAdInquiryEmail };
