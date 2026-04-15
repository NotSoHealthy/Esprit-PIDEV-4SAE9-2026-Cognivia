package com.pidev.notifications.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    public StompAuthChannelInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null)
            return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = firstNonBlank(
                    accessor.getFirstNativeHeader("Authorization"),
                    accessor.getFirstNativeHeader("authorization"));

            String token = extractBearerToken(authorization);
            Jwt jwt = jwtDecoder.decode(token);

            String subject = jwt.getSubject();
            if (subject == null || subject.isBlank()) {
                throw new MessagingException("JWT subject (sub) is missing");
            }

            AbstractAuthenticationToken authentication = new JwtAuthenticationToken(jwt, Collections.emptyList(),
                    subject);

            accessor.setUser(authentication);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        return message;
    }

    private static String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new MessagingException("Missing Authorization header in STOMP CONNECT");
        }
        String trimmed = authorizationHeader.trim();

        if (!trimmed.regionMatches(true, 0, "Bearer", 0, 6)) {
            throw new MessagingException("Authorization header must be 'Bearer <token>'");
        }

        if (trimmed.length() == 6) {
            throw new MessagingException("Bearer token is empty");
        }

        if (!Character.isWhitespace(trimmed.charAt(6))) {
            throw new MessagingException("Authorization header must be 'Bearer <token>'");
        }

        String token = trimmed.substring(7).trim();
        if (token.isEmpty()) {
            throw new MessagingException("Bearer token is empty");
        }
        return token;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank())
            return a;
        if (b != null && !b.isBlank())
            return b;
        return null;
    }
}
