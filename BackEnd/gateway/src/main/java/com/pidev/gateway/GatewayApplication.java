package com.pidev.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

        public static void main(String[] args) {
                SpringApplication.run(GatewayApplication.class, args);
        }

        @Bean
        public SecurityWebFilterChain security(ServerHttpSecurity http) {
                return http
                                .cors(Customizer.withDefaults())
                                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                                .authorizeExchange(exchanges -> exchanges
                                                .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .pathMatchers("/notifications/ws/**", "/notifications/ws").permitAll()
                                                .pathMatchers("/auth/**").permitAll()
                                                .pathMatchers("/admin/**").hasRole("ADMIN")
                                                .anyExchange().authenticated())
                                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                                .build();
        }

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()
                                // ===== APPOINTMENTS : /appointments/** -> lb://APPOINTMENT-SERVICE with
                                // RewritePath to /api/appointments/**
                                .route("appointment-service",
                                                r -> r.path("/appointments/**")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb://APPOINTMENT-SERVICE"))
                                .route("care",
                                                r -> r.path("/care/**")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb://care"))
                                .route("monitoring",
                                                r -> r.path("/monitoring/**")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb://monitoring"))
                                .route("posts",
                                                r -> r.path("/posts/**")
                                                                .uri("lb://FORUM-SERVICE"))

                                .route("pharmacy",
                                                r -> r.path("/pharmacy/**")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb://pharmacy"))
                                .route("chat",
                                                r -> r.path("/chat/**")
                                                                .uri("lb://DPCHAT"))
                                .route("games",
                                                r -> r.path("/games/**")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb://Games"))
                                .route("SurveillanceAndEquipment",
                                                r -> r.path("/Equipment/**")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb://SurveillanceAndEquipment"))
                                // WebSocket (STOMP) endpoint for notifications: /notifications/ws ->
                                // lb:ws://notifications/ws
                                .route("notifications-ws",
                                                r -> r.path("/notifications/ws/**", "/notifications/ws")
                                                                .filters(f -> f.stripPrefix(1))
                                                                .uri("lb:ws://notifications"))
                                .route("notifications",
                                                r -> r.path("/notifications/**")
                                                                .uri("lb://notifications"))
                                .build();

        }
}
