package org.example.forumservice.services;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class BadWordFilterService {

    private final List<String> restrictedWords = Arrays.asList(
            // General insults
            "idiot", "stupid", "dumb", "moron", "loser", "fool", "trash",
            "useless", "pathetic", "clown", "jerk", "creep", "weirdo",
            "scum", "garbage", "nonsense", "ignorant", "brainless",
            "imbecile", "dimwit", "airhead", "blockhead", "coward", "fuck",

            // Hate / hostility
            "hate", "racist", "sexist", "bigot", "nazi", "terrorist",
            "extremist", "supremacist", "xenophobic", "homophobic",
            "intolerant", "radical",

            // Violence-related
            "kill", "murder", "die", "suicide", "attack", "shoot",
            "stab", "bomb", "assault", "destroy", "eliminate",
            "execute", "slaughter", "massacre", "threat", "violent",

            // Harassment / bullying
            "ugly", "fat", "disgusting", "worthless", "retard",
            "annoying", "obnoxious", "lame", "freak", "psycho",
            "crazy", "insane", "lazy", "failure", "embarrassing",

            // Toxic behavior
            "shut up", "go away", "nobody cares", "get lost",
            "drop dead", "you suck", "piece of trash",

            // Profanity (non-explicit)
            "damn", "hell", "crap", "sucks", "screw you",

            // Self-harm sensitive words (flag for review, not auto-block)
            "selfharm", "self-harm", "overdose",

            // Profanity
            "fuck", "fucking", "fucker", "fucked",
            "shit", "shitty",
            "bitch", "bastard",
            "asshole", "dick", "piss",
            "wtf", "stfu",
            // Hate indicators
            "white supremacy",
            "black supremacy",
            "go back to africa",
            "go back to your country",
            "go back to ur country",
            "your kind",
            "dirty immigrant",
            "illegal immigrant",
            "subhuman",
            "vermin",
            "negga",
            "nigger"

    );

    public void validateText(String text) {
        if (text == null || text.isBlank()) {
            return;
        }

        for (String word : restrictedWords) {
            // Regex for whole word matching, case-insensitive
            String regex = "\\b(?i)" + Pattern.quote(word) + "\\b";
            if (Pattern.compile(regex).matcher(text).find()) {
                throw new RuntimeException("Your content contains inappropriate language: " + word);
            }
        }
    }
}
