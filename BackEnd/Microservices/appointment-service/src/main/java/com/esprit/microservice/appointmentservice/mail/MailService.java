package com.esprit.microservice.appointmentservice.mail;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendTestEmail(String to) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(to);
            msg.setSubject("Test Email from appointment-service");
            msg.setText("Hello! SMTP is working. This is a test email.");

            mailSender.send(msg);
            log.info("Test email sent to={}", to);
        } catch (Exception e) {
            log.error("Test email failed to={}: {}", to, e.toString());
        }
    }

    // ✅ MODIFIED: accept meetLink and perform replacement
    @Async
    public void sendHtmlEmail(String to, String subject, String html, String meetLink) {
        try {
            // ✅ Inject Video Consultation Block
            if (html != null && html.contains("${meetLink}")) {
                String roomName = (meetLink != null) ? meetLink.replace("https://meet.jit.si/", "") : "";
                
                String videoBlock = """
                    <div style="background:#EEF2FF; border-radius:10px; padding:24px; margin:24px 0; text-align:center; border:1px solid #C7D2FE;">
                      <p style="font-size:18px; font-weight:bold; color:#3730A3; margin:0 0 8px 0;">Video Consultation Available</p>
                      <p style="font-size:14px; color:#555; margin:0 0 20px 0;">If you cannot travel, join your doctor online from home.</p>
                      <a href="%s" style="background:#4F46E5; color:#ffffff; padding:14px 32px; border-radius:8px; text-decoration:none; font-size:16px; font-weight:bold; display:inline-block;">Join Video Consultation</a>
                      
                      <div style="background:#F0F4FF; border-radius:8px; padding:16px; margin:16px 0; text-align:center;">
                        <p style="font-size:13px; color:#555; margin:0 0 6px 0;">If you are asked for a room name, enter:</p>
                        <p style="font-size:18px; font-weight:bold; color:#3730A3; font-family:monospace; margin:0; letter-spacing:1px;">%s</p>
                      </div>

                      <p style="font-size:11px; color:#888; margin:16px 0 0 0;">Or copy this link in your browser:<br/><span style="color:#4F46E5;">%s</span></p>
                    </div>
                    """.formatted(meetLink, roomName, meetLink);
                
                html = html.replace("${meetLink}", videoBlock);
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true); // true => HTML

            mailSender.send(message);
            log.info("HTML email sent to={} (Meet link injected)", to);
        } catch (Exception e) {
            log.error("HTML email failed to={}: {}", to, e.toString());
        }
    }
}