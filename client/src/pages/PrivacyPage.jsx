import { Link } from "react-router-dom";
import Nav from "../components/Nav";

export default function PrivacyPage() {
  return (
    <div className="nu-root">
      <Nav />
      <main className="pp-main" id="main-content">
        <article className="pp-content">
          <h1>Privacy Policy</h1>
          <p className="pp-updated">Last updated: June 2026</p>

          <p>nucorns ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website at nucorns.com (the "Service").</p>

          <h2>1. Information We Collect</h2>
          <h3>Account Information</h3>
          <p>When you create an account, we collect your chosen display name, handle (username), email address, and a hashed version of your password. You may optionally provide a bio, location, interests, and a profile photo.</p>
          <h3>Content You Create</h3>
          <p>We store the posts, comments, photos, videos, and other media you upload or publish through the Service.</p>
          <h3>Messages</h3>
          <p>Direct messages you send to other users are stored on our servers to deliver the messaging feature.</p>
          <h3>Usage Data</h3>
          <p>We may collect information about how you access and use the Service, including your IP address, browser type, pages visited, and referring URLs. This data is used for security and service improvement only.</p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and improve the Service</li>
            <li>To create and manage your account</li>
            <li>To display your public profile and content to other users</li>
            <li>To deliver direct messages between users</li>
            <li>To moderate content for safety using automated tools (see Section 5)</li>
            <li>To send transactional emails related to advertising inquiries</li>
            <li>To detect and prevent fraud, abuse, or security incidents</li>
          </ul>

          <h2>3. Cookies</h2>
          <p>We use a single session cookie (<code>nucorns.sid</code>) to keep you signed in. This cookie is essential for the Service to function and cannot be opted out of while using authenticated features. We do not use tracking cookies, analytics cookies, or third-party advertising cookies.</p>

          <h2>4. Data Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
          <ul>
            <li><strong>Public content:</strong> Posts, comments, and profile information you make public are visible to all visitors.</li>
            <li><strong>Service providers:</strong> We use third-party services to host our platform (Render.com) and to moderate content (Anthropic). These providers process data only as necessary to provide their services to us.</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law, legal process, or governmental request.</li>
          </ul>

          <h2>5. Content Moderation</h2>
          <p>To maintain a safe community, text and images you submit may be analyzed by automated moderation tools powered by Anthropic's AI services. This analysis is performed solely to detect content that violates our community guidelines (e.g., hate speech, harassment, explicit material). We do not use your content to train AI models.</p>

          <h2>6. Data Storage and Security</h2>
          <p>Your data is stored on servers hosted by Render.com in the United States. We use industry-standard security measures including encrypted passwords (bcrypt hashing), secure session cookies, and HTTPS encryption for all data in transit. However, no method of electronic storage is 100% secure.</p>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> your personal data through your profile and settings pages</li>
            <li><strong>Correct</strong> your information by editing your profile in Settings</li>
            <li><strong>Delete</strong> your posts and comments at any time</li>
            <li><strong>Request deletion</strong> of your account by contacting us</li>
          </ul>
          <p>If you are a resident of the European Economic Area (EEA), you may also have additional rights under the General Data Protection Regulation (GDPR), including the right to data portability and the right to lodge a complaint with a supervisory authority.</p>
          <p>If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected and the right to request its deletion.</p>

          <h2>8. Children's Privacy</h2>
          <p>The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will take steps to delete it promptly.</p>

          <h2>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" date at the top of this page. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>

          <h2>10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at <a href="mailto:rcorn88@gmail.com">rcorn88@gmail.com</a>.</p>
        </article>

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · your privacy matters ✦ · <Link to="/privacy">Privacy</Link></footer>
      </main>
    </div>
  );
}
