package com.pidev.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
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
                                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                                .authorizeExchange(exchanges -> exchanges
                                                .pathMatchers("/auth/**").permitAll()
                                                .pathMatchers("/admin/**").hasRole("ADMIN")
                                                .anyExchange().authenticated())
                                .oauth2ResourceServer(oauth -> oauth.jwt())
                                .build();
        }

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()
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
                                .route("chat",
                                                r -> r.path("/chat/**")
                                                                .uri("lb://DPCHAT"))
                                .build();
        }
}
