package org.example.dpchat.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
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
        public String id;
        public String name;
        public String role;

        public UserProfile(String id, String name, String role) {
            this.id = id;
            this.name = name;
            this.role = role;
        }

        // backward-compat constructor (used by lookupUser)
        public UserProfile(String name, String role) {
            this.name = name;
            this.role = role;
        }
    }

    /** Returns all doctors and caregivers from the care database. */
    public List<UserProfile> getAllUsers() {
        List<UserProfile> users = new ArrayList<>();
        try {
            List<Map<String, Object>> doctors = jdbc.queryForList(
                    "SELECT user_id::text AS user_id, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name FROM doctor WHERE user_id IS NOT NULL",
                    Collections.emptyMap());
            for (Map<String, Object> row : doctors) {
                String id = String.valueOf(row.get("user_id"));
                String name = (row.get("first_name") + " " + row.get("last_name")).trim();
                if (name.isEmpty())
                    name = "Unknown Doctor";
                users.add(new UserProfile(id, name, "Doctor"));
            }

            List<Map<String, Object>> caregivers = jdbc.queryForList(
                    "SELECT user_id::text AS user_id, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name FROM caregiver WHERE user_id IS NOT NULL",
                    Collections.emptyMap());
            for (Map<String, Object> row : caregivers) {
                String id = String.valueOf(row.get("user_id"));
                String name = (row.get("first_name") + " " + row.get("last_name")).trim();
                if (name.isEmpty())
                    name = "Unknown Caregiver";
                users.add(new UserProfile(id, name, "Caregiver"));
            }
        } catch (Exception e) {
            System.err.println("Error fetching all users: " + e.getMessage());
        }
        return users;
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
                String name = doc.get("first_name") + " " + doc.get("last_name");
                return Optional.of(new UserProfile(name.trim(), "Doctor"));
            }

            // Check Caregiver table
            List<Map<String, Object>> caregivers = jdbc.queryForList(
                    "SELECT first_name, last_name FROM caregiver WHERE user_id = :userId", params);

            if (!caregivers.isEmpty()) {
                Map<String, Object> cg = caregivers.get(0);
                String name = cg.get("first_name") + " " + cg.get("last_name");
                return Optional.of(new UserProfile(name.trim(), "Caregiver"));
            }

        } catch (Exception e) {
            System.err.println("Error looking up user info in DPchat: " + e.getMessage());
        }

        return Optional.empty();
    }
}
