package org.example.dpchat.services;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserLookupService {

    private final NamedParameterJdbcTemplate careJdbc;
    private final NamedParameterJdbcTemplate pharmacyJdbc;
    private final Map<String, UserProfile> userCache = new ConcurrentHashMap<>();

    public UserLookupService(
            @Qualifier("careJdbcTemplate") NamedParameterJdbcTemplate careJdbc,
            @Qualifier("pharmacyJdbcTemplate") NamedParameterJdbcTemplate pharmacyJdbc) {
        this.careJdbc = careJdbc;
        this.pharmacyJdbc = pharmacyJdbc;
    }

    @Getter
    @AllArgsConstructor
    public static class UserProfile {
        public String id;
        public String name;
        public String role;

        // backward-compat constructor (used by lookupUser)
        public UserProfile(String name, String role) {
            this.name = name;
            this.role = role;
        }
    }

    /** Returns all doctors and caregivers from the care database. */
    public List<UserProfile> getAllUsers() {
        Map<String, UserProfile> userMap = new LinkedHashMap<>();
        userCache.clear();
        try {
            List<Map<String, Object>> doctors = careJdbc.queryForList(
                    "SELECT user_id::text AS user_id, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name FROM doctor WHERE user_id IS NOT NULL",
                    Collections.emptyMap());
            for (Map<String, Object> row : doctors) {
                String id = String.valueOf(row.get("user_id")).trim().toLowerCase();
                String name = (row.get("first_name") + " " + row.get("last_name")).trim();
                if (name.isEmpty())
                    name = "Unknown Doctor";
                userMap.put(id, new UserProfile(id, name, "Doctor"));
                userCache.put(id, userMap.get(id));
            }

            List<Map<String, Object>> caregivers = careJdbc.queryForList(
                    "SELECT user_id::text AS user_id, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name FROM caregiver WHERE user_id IS NOT NULL",
                    Collections.emptyMap());
            for (Map<String, Object> row : caregivers) {
                String id = String.valueOf(row.get("user_id")).trim().toLowerCase();
                String name = (row.get("first_name") + " " + row.get("last_name")).trim();
                if (name.isEmpty())
                    name = "Unknown Caregiver";
                if (!userMap.containsKey(id)) {
                    userMap.put(id, new UserProfile(id, name, "Caregiver"));
                    userCache.put(id, userMap.get(id));
                }
            }

            // Fetch Pharmacists from pharmacy database
            List<Map<String, Object>> pharmacists = pharmacyJdbc.queryForList(
                    "SELECT user_id::text AS user_id, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name FROM pharmacist WHERE user_id IS NOT NULL",
                    Collections.emptyMap());
            for (Map<String, Object> row : pharmacists) {
                String id = String.valueOf(row.get("user_id")).trim().toLowerCase();
                String name = (row.get("first_name") + " " + row.get("last_name")).trim();
                if (name.isEmpty())
                    name = "Unknown Pharmacist";
                if (!userMap.containsKey(id)) {
                    userMap.put(id, new UserProfile(id, name, "Pharmacist"));
                    userCache.put(id, userMap.get(id));
                }
            }

            // Fetch Patients from care database
            List<Map<String, Object>> patients = careJdbc.queryForList(
                    "SELECT user_id::text AS user_id, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name FROM patient WHERE user_id IS NOT NULL",
                    Collections.emptyMap());
            for (Map<String, Object> row : patients) {
                String id = String.valueOf(row.get("user_id")).trim().toLowerCase();
                String name = (row.get("first_name") + " " + row.get("last_name")).trim();
                if (name.isEmpty())
                    name = "Unknown Patient";
                if (!userMap.containsKey(id)) {
                    userMap.put(id, new UserProfile(id, name, "Patient"));
                    userCache.put(id, userMap.get(id));
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching all users: " + e.getMessage());
        }
        return new ArrayList<>(userMap.values());
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
            List<Map<String, Object>> doctors = careJdbc.queryForList(
                    "SELECT first_name, last_name FROM doctor WHERE user_id = :userId", params);

            if (!doctors.isEmpty()) {
                Map<String, Object> doc = doctors.get(0);
                String name = (doc.get("first_name") + " " + doc.get("last_name")).trim();
                UserProfile profile = new UserProfile(normalizedId, name, "Doctor");
                userCache.put(normalizedId, profile);
                return Optional.of(profile);
            }

            // Check Caregiver table
            List<Map<String, Object>> caregivers = careJdbc.queryForList(
                    "SELECT first_name, last_name FROM caregiver WHERE user_id = :userId", params);

            if (!caregivers.isEmpty()) {
                Map<String, Object> cg = caregivers.get(0);
                String name = (cg.get("first_name") + " " + cg.get("last_name")).trim();
                UserProfile profile = new UserProfile(normalizedId, name, "Caregiver");
                userCache.put(normalizedId, profile);
                return Optional.of(profile);
            }

            // Check Pharmacist table
            List<Map<String, Object>> pharmacists = pharmacyJdbc.queryForList(
                    "SELECT first_name, last_name FROM pharmacist WHERE user_id = :userId", params);

            if (!pharmacists.isEmpty()) {
                Map<String, Object> ph = pharmacists.get(0);
                String name = (ph.get("first_name") + " " + ph.get("last_name")).trim();
                UserProfile profile = new UserProfile(normalizedId, name, "Pharmacist");
                userCache.put(normalizedId, profile);
                return Optional.of(profile);
            }

            // Check Patient table
            List<Map<String, Object>> patients = careJdbc.queryForList(
                    "SELECT first_name, last_name FROM patient WHERE user_id = :userId", params);

            if (!patients.isEmpty()) {
                Map<String, Object> pt = patients.get(0);
                String name = (pt.get("first_name") + " " + pt.get("last_name")).trim();
                UserProfile profile = new UserProfile(normalizedId, name, "Patient");
                userCache.put(normalizedId, profile);
                return Optional.of(profile);
            }

        } catch (Exception e) {
            System.err.println("Error looking up user info in DPchat for " + userId + ": " + e.getMessage());
        }

        return Optional.empty();
    }
}
