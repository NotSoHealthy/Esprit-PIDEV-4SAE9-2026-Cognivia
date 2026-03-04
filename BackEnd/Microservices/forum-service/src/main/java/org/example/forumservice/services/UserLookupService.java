package org.example.forumservice.services;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserLookupService {

    private final NamedParameterJdbcTemplate jdbc;
    private final Map<String, UserProfile> userCache = new ConcurrentHashMap<>();

    // @Qualifier cannot be used with @AllArgsConstructor, so we keep the explicit
    // constructor
    public UserLookupService(@Qualifier("careJdbcTemplate") NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Getter
    @AllArgsConstructor
    public static class UserProfile {
        public String fullName;
        public String role;
    }

    public Optional<UserProfile> lookupUser(String userId) {
        if (userId == null)
            return Optional.empty();

        String normalizedId = userId.trim().toLowerCase();
        if (userCache.containsKey(normalizedId)) {
            return Optional.of(userCache.get(normalizedId));
        }

        try {
            UUID uuid = UUID.fromString(normalizedId);
            MapSqlParameterSource params = new MapSqlParameterSource("userId", uuid);

            // Check Doctor table
            List<Map<String, Object>> doctors = jdbc.queryForList(
                    "SELECT first_name, last_name FROM doctor WHERE user_id = :userId", params);

            if (!doctors.isEmpty()) {
                Map<String, Object> doc = doctors.get(0);
                String fullName = (doc.get("first_name") + " " + doc.get("last_name")).trim();
                UserProfile profile = new UserProfile(fullName, "Doctor");
                userCache.put(normalizedId, profile);
                return Optional.of(profile);
            }

            // Check Caregiver table
            List<Map<String, Object>> caregivers = jdbc.queryForList(
                    "SELECT first_name, last_name FROM caregiver WHERE user_id = :userId", params);

            if (!caregivers.isEmpty()) {
                Map<String, Object> cg = caregivers.get(0);
                String fullName = (cg.get("first_name") + " " + cg.get("last_name")).trim();
                UserProfile profile = new UserProfile(fullName, "Caregiver");
                userCache.put(normalizedId, profile);
                return Optional.of(profile);
            }

        } catch (Exception e) {
            System.err.println("Error looking up user info in Forum: " + e.getMessage());
        }

        return Optional.empty();
    }
}
