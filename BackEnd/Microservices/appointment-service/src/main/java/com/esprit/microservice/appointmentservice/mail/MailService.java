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

    // ✅ AJOUT: envoyer HTML (template venant du frontend)
    @Async
    public void sendHtmlEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true); // true => HTML

            mailSender.send(message);
            log.info("HTML email sent to={}", to);
        } catch (Exception e) {
            log.error("HTML email failed to={}: {}", to, e.toString());
        }
    }
}