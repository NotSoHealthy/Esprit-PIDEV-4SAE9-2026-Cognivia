package org.example.forumservice.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserLookupService {

    private final NamedParameterJdbcTemplate jdbc;

    public UserLookupService(@Qualifier("careJdbcTemplate") NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static class UserProfile {
        public String fullName;
        public String role;

        public UserProfile(String fullName, String role) {
            this.fullName = fullName;
            this.role = role;
        }
    }

    public Optional<UserProfile> lookupUser(String userId) {
        if (userId == null)
            return Optional.empty();

        try {
            UUID uuid = UUID.fromString(userId);
            MapSqlParameterSource params = new MapSqlParameterSource("userId", uuid);

            // Check Doctor table
            List<Map<String, Object>> doctors = jdbc.queryForList(
                    "SELECT first_name, last_name FROM doctor WHERE user_id = :userId", params);

            if (!doctors.isEmpty()) {
                Map<String, Object> doc = doctors.get(0);
                String fullName = doc.get("first_name") + " " + doc.get("last_name");
                return Optional.of(new UserProfile(fullName, "Doctor"));
            }

            // Check Caregiver table
            List<Map<String, Object>> caregivers = jdbc.queryForList(
                    "SELECT first_name, last_name FROM caregiver WHERE user_id = :userId", params);

            if (!caregivers.isEmpty()) {
                Map<String, Object> cg = caregivers.get(0);
                String fullName = cg.get("first_name") + " " + cg.get("last_name");
                return Optional.of(new UserProfile(fullName, "Caregiver"));
            }

        } catch (Exception e) {
            // Log error if needed, but return empty to avoid breaking the main flow
            System.err.println("Error looking up user info: " + e.getMessage());
        }

        return Optional.empty();
    }
}
