package com.aal.erp_backend.config;

import com.aal.erp_backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Profile
                .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/v1/auth/profile").authenticated()

                // Payments
                .requestMatchers(HttpMethod.GET, "/api/v1/payments/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/payments/**").permitAll()

                // Invoices
                .requestMatchers(HttpMethod.GET, "/api/v1/invoices/**").authenticated()

                // Orders
                .requestMatchers(HttpMethod.GET, "/api/v1/orders/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/orders/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/v1/orders/**")
                    .hasAnyRole("ADMIN", "MANAGEMENT")
                // ✅ PATCH – any authenticated user (frontend already hides button for non‑admins)
                .requestMatchers(HttpMethod.PATCH, "/api/v1/orders/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/v1/orders/**")
                    .hasRole("ADMIN")

                // Admin only
                .requestMatchers("/api/v1/users/**").hasRole("ADMIN")

                // Inventory
                .requestMatchers(HttpMethod.GET, "/api/v1/inventory/**")
                    .hasAnyRole("ADMIN", "MANAGEMENT", "WAREHOUSE_STAFF", "CUSTOMER")
                .requestMatchers(HttpMethod.POST, "/api/v1/inventory/adjust")
                    .hasAnyRole("ADMIN", "MANAGEMENT", "WAREHOUSE_STAFF")
                .requestMatchers("/api/v1/inventory/**")
                    .hasAnyRole("ADMIN", "MANAGEMENT", "WAREHOUSE_STAFF")

                // Notifications
                .requestMatchers(HttpMethod.GET, "/api/v1/notifications/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/v1/notifications/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}