package com.pidev.notifications.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StompAuthChannelInterceptorTest {

    @Mock
    private JwtDecoder jwtDecoder;

    @InjectMocks
    private StompAuthChannelInterceptor interceptor;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void preSend_connectWithAuthorization_setsUserAndSecurityContext() {
        Jwt jwt = Jwt.withTokenValue("token")
                .headers(h -> h.put("alg", "none"))
                .claims(c -> c.putAll(Map.of("sub", "user-1")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        when(jwtDecoder.decode(eq("token"))).thenReturn(jwt);

        Message<?> message = stompMessage(StompCommand.CONNECT, "Authorization", "Bearer token");
        MessageChannel channel = mock(MessageChannel.class);

        Message<?> result = interceptor.preSend(message, channel);

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
        assertThat(accessor.getUser()).isNotNull();
        assertThat(accessor.getUser().getName()).isEqualTo("user-1");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getName()).isEqualTo("user-1");

        verify(jwtDecoder).decode("token");
        verifyNoMoreInteractions(jwtDecoder);
    }

    @Test
    void preSend_connectWithLowercaseAuthorizationHeader_isAccepted() {
        Jwt jwt = Jwt.withTokenValue("t")
                .headers(h -> h.put("alg", "none"))
                .claims(c -> c.put("sub", "user-2"))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        when(jwtDecoder.decode(eq("t"))).thenReturn(jwt);

        Message<?> message = stompMessage(StompCommand.CONNECT, "authorization", "Bearer t");
        Message<?> result = interceptor.preSend(message, mock(MessageChannel.class));

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
        assertThat(accessor.getUser()).isNotNull();
        assertThat(accessor.getUser().getName()).isEqualTo("user-2");

        verify(jwtDecoder).decode("t");
        verifyNoMoreInteractions(jwtDecoder);
    }

    @Test
    void preSend_connectMissingAuthorization_throws() {
        Message<?> message = stompMessage(StompCommand.CONNECT, null, null);

        assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                .isInstanceOf(MessagingException.class)
                .hasMessageContaining("Missing Authorization header");

        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void preSend_connectNonBearerAuthorization_throws() {
        Message<?> message = stompMessage(StompCommand.CONNECT, "Authorization", "Basic abc");

        assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                .isInstanceOf(MessagingException.class)
                .hasMessageContaining("Authorization header must be 'Bearer <token>'");

        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void preSend_connectEmptyBearerToken_throws() {
        Message<?> message = stompMessage(StompCommand.CONNECT, "Authorization", "Bearer   ");

        assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                .isInstanceOf(MessagingException.class)
                .hasMessageContaining("Bearer token is empty");

        verifyNoInteractions(jwtDecoder);
    }

    @Test
    void preSend_connectJwtWithMissingSubject_throws() {
        Jwt jwt = Jwt.withTokenValue("token")
                .headers(h -> h.put("alg", "none"))
                .claims(c -> c.put("some", "claim"))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        when(jwtDecoder.decode(eq("token"))).thenReturn(jwt);

        Message<?> message = stompMessage(StompCommand.CONNECT, "Authorization", "Bearer token");

        assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                .isInstanceOf(MessagingException.class)
                .hasMessageContaining("JWT subject (sub) is missing");

        verify(jwtDecoder).decode("token");
        verifyNoMoreInteractions(jwtDecoder);
    }

    @Test
    void preSend_nonConnectCommand_doesNothing() {
        Message<?> message = stompMessage(StompCommand.SEND, "Authorization", "Bearer token");

        Message<?> result = interceptor.preSend(message, mock(MessageChannel.class));

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
        assertThat(accessor.getUser()).isNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();

        verifyNoInteractions(jwtDecoder);
    }

    private static Message<byte[]> stompMessage(StompCommand command, String headerName, String headerValue) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionId("s1");
        if (headerName != null) {
            accessor.setNativeHeader(headerName, headerValue);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
