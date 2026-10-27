package com.armada.backend;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicLong;

public class ChatHandler extends TextWebSocketHandler {

    private static final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    private static final Map<String, String> lootPiles = new ConcurrentHashMap<>();
    private static final Map<String, String> lootContents = new ConcurrentHashMap<>();
    private static final Map<String, String> pileOwners = new ConcurrentHashMap<>();
    private static final AtomicLong pileCounter = new AtomicLong(1);

    // Best completion time per player, in whole seconds. Lowest wins.
    private static final Map<String, Integer> bestTimes = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);

        for (String pile : lootPiles.values()) {
            session.sendMessage(new TextMessage(pile));
        }

        // new arrivals get the board straight away
        session.sendMessage(new TextMessage(buildLeaderboard()));

        System.out.println("A player connected. Total online: " + sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String text = message.getPayload();

        if (text.startsWith("{")) {
            String type = readString(text, "type", "");

            if (type.equals("death")) {
                handleDeath(session, text);
                return;
            }
            if (type.equals("claim")) {
                handleClaim(session, text);
                return;
            }
            if (type.equals("finish")) {
                handleFinish(session, text);
                return;
            }
            if (type.equals("leaderboardRequest")) {
                session.sendMessage(new TextMessage(buildLeaderboard()));
                return;
            }
        }

        System.out.println("Message received: " + text);
        broadcast(text);
    }

    // A player finished the game. Keep their best run and tell everyone.
    private void handleFinish(WebSocketSession session, String text) throws Exception {
        String name = readString(text, "name", "Someone");
        int seconds = readInt(text, "time", 0);
        if (seconds <= 0 || seconds > 86400) return;      // ignore nonsense

        Integer previous = bestTimes.get(name);
        if (previous == null || seconds < previous) {
            bestTimes.put(name, seconds);
            System.out.println(name + " finished in " + seconds + "s (best so far)");
        } else {
            System.out.println(name + " finished in " + seconds + "s (slower than " + previous + "s)");
        }

        broadcast(buildLeaderboard());
    }

    // The ten lowest times, fastest first, as JSON.
    private static String buildLeaderboard() {
        java.util.List<Map.Entry<String, Integer>> all =
                new java.util.ArrayList<>(bestTimes.entrySet());
        all.sort(java.util.Comparator.comparingInt(Map.Entry::getValue));

        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":\"leaderboard\",\"entries\":[");
        int n = Math.min(10, all.size());
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(",");
            sb.append("{\"name\":\"").append(escape(all.get(i).getKey()))
                    .append("\",\"time\":").append(all.get(i).getValue()).append("}");
        }
        sb.append("]}");
        return sb.toString();
    }

    private void handleDeath(WebSocketSession session, String text) throws Exception {
        broadcast(text);

        String loot = readArray(text, "loot");
        if (loot == null || loot.equals("[]")) return;

        String id = "pile" + pileCounter.getAndIncrement();
        String owner = readString(text, "name", "Someone");
        String room = readString(text, "room", "");
        int x = readInt(text, "x", 0);
        int y = readInt(text, "y", 0);

        String pile = "{\"type\":\"lootDropped\""
                + ",\"id\":\"" + escape(id) + "\""
                + ",\"owner\":\"" + escape(owner) + "\""
                + ",\"room\":\"" + escape(room) + "\""
                + ",\"x\":" + x
                + ",\"y\":" + y
                + ",\"loot\":" + loot
                + "}";

        lootPiles.put(id, pile);
        lootContents.put(id, loot);
        pileOwners.put(id, session.getId());

        System.out.println("Loot dropped: " + id + " by " + owner);
        broadcast(pile);
    }

    private void handleClaim(WebSocketSession session, String text) throws Exception {
        String id = readString(text, "id", "");
        String claimer = readString(text, "name", "Someone");

        String pile = lootPiles.remove(id);

        if (pile == null) {
            session.sendMessage(new TextMessage(
                    "{\"type\":\"claimFailed\",\"id\":\"" + escape(id) + "\"}"));
            return;
        }

        String loot = lootContents.remove(id);
        pileOwners.remove(id);

        String taken = "{\"type\":\"lootTaken\""
                + ",\"id\":\"" + escape(id) + "\""
                + ",\"by\":\"" + escape(claimer) + "\""
                + ",\"loot\":" + (loot == null ? "[]" : loot)
                + "}";

        System.out.println("Loot " + id + " claimed by " + claimer);
        broadcast(taken);
    }

    private void broadcast(String text) throws Exception {
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                s.sendMessage(new TextMessage(text));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);

        for (Map.Entry<String, String> entry : pileOwners.entrySet()) {
            if (!entry.getValue().equals(session.getId())) continue;

            String id = entry.getKey();
            lootPiles.remove(id);
            lootContents.remove(id);
            pileOwners.remove(id);

            broadcast("{\"type\":\"lootExpired\",\"id\":\"" + escape(id) + "\"}");
        }

        System.out.println("A player disconnected. Total online: " + sessions.size());
    }

    private static String stripArrays(String src) {
        StringBuilder out = new StringBuilder();
        int depth = 0;
        boolean inStr = false, esc = false;
        for (int i = 0; i < src.length(); i++) {
            char c = src.charAt(i);
            if (inStr) {
                if (esc) esc = false;
                else if (c == '\\') esc = true;
                else if (c == '"') inStr = false;
                if (depth == 0) out.append(c);
                continue;
            }
            if (c == '"') {
                inStr = true;
                if (depth == 0) out.append(c);
                continue;
            }
            if (c == '[') { depth++; continue; }
            if (c == ']') { if (depth > 0) depth--; continue; }
            if (depth == 0) out.append(c);
        }
        return out.toString();
    }

    private static String readString(String src, String key, String fallback) {
        String flat = stripArrays(src);
        String needle = "\"" + key + "\"";
        int k = flat.indexOf(needle);
        if (k < 0) return fallback;
        int colon = flat.indexOf(':', k + needle.length());
        if (colon < 0) return fallback;
        int quote = flat.indexOf('"', colon);
        if (quote < 0) return fallback;

        StringBuilder sb = new StringBuilder();
        boolean esc = false;
        for (int i = quote + 1; i < flat.length(); i++) {
            char c = flat.charAt(i);
            if (esc) { sb.append(c); esc = false; continue; }
            if (c == '\\') { esc = true; continue; }
            if (c == '"') break;
            sb.append(c);
        }
        return sb.toString();
    }

    private static int readInt(String src, String key, int fallback) {
        String flat = stripArrays(src);
        String needle = "\"" + key + "\"";
        int k = flat.indexOf(needle);
        if (k < 0) return fallback;
        int colon = flat.indexOf(':', k + needle.length());
        if (colon < 0) return fallback;

        StringBuilder sb = new StringBuilder();
        for (int i = colon + 1; i < flat.length(); i++) {
            char c = flat.charAt(i);
            if (c == ' ') continue;
            if (c == '-' || (c >= '0' && c <= '9')) sb.append(c);
            else break;
        }
        if (sb.length() == 0) return fallback;
        try {
            return Integer.parseInt(sb.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static String readArray(String src, String key) {
        String needle = "\"" + key + "\"";
        int k = src.indexOf(needle);
        if (k < 0) return null;
        int open = src.indexOf('[', k + needle.length());
        if (open < 0) return null;

        int depth = 0;
        boolean inStr = false, esc = false;
        for (int i = open; i < src.length(); i++) {
            char c = src.charAt(i);
            if (inStr) {
                if (esc) esc = false;
                else if (c == '\\') esc = true;
                else if (c == '"') inStr = false;
                continue;
            }
            if (c == '"') { inStr = true; continue; }
            if (c == '[') depth++;
            else if (c == ']') {
                depth--;
                if (depth == 0) return src.substring(open, i + 1);
            }
        }
        return null;
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}