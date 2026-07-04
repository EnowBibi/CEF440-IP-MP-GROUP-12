package com.codewithpcodes.cardiag.auth.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;

/**
 * Cookie read/write helpers plus a hardened (de)serialization scheme used to
 * carry the OAuth2 authorization request across the redirect to the provider
 * (sessions are stateless).
 *
 * <p>Cookies are attacker-controlled, so native Java deserialization of their
 * contents would be a remote-code-execution gadget risk. Two defenses are
 * applied:
 * <ol>
 *   <li>The serialized payload is HMAC-SHA256 signed with a server-side secret.
 *       The signature is verified (constant-time) <em>before</em> any bytes are
 *       deserialized, so an attacker cannot supply arbitrary bytes at all.</li>
 *   <li>An {@link ObjectInputFilter} allowlist restricts deserialization to the
 *       {@code OAuth2AuthorizationRequest} class graph as defense-in-depth.</li>
 * </ol>
 */
public final class CookieUtils {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    /** Allow only the OAuth2 authorization-request graph and base JDK types; reject everything else. */
    private static final ObjectInputFilter SAFE_FILTER = ObjectInputFilter.Config.createFilter(
            "org.springframework.security.oauth2.core.**;"
                    + "java.util.*;java.lang.*;java.time.*;java.net.*;!*");

    private CookieUtils() {
    }

    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals(name)) {
                return Optional.of(cookie);
            }
        }
        return Optional.empty();
    }

    public static void addCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(maxAgeSeconds);
        response.addCookie(cookie);
    }

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        getCookie(request, name).ifPresent(cookie -> {
            cookie.setValue("");
            cookie.setPath("/");
            cookie.setMaxAge(0);
            response.addCookie(cookie);
        });
    }

    /** Returns {@code base64(hmac) + "." + base64(serializedBytes)}. */
    public static String serialize(Serializable object, byte[] hmacKey) {
        byte[] data = toBytes(object);
        byte[] mac = hmac(hmacKey, data);
        return base64(mac) + "." + base64(data);
    }

    /** Verifies the HMAC, then deserializes under a strict class allowlist. */
    public static <T> T deserialize(Cookie cookie, Class<T> cls, byte[] hmacKey) {
        String value = cookie.getValue();
        int dot = value.indexOf('.');
        if (dot < 0) {
            throw new IllegalStateException("Malformed signed cookie value");
        }
        byte[] mac = unbase64(value.substring(0, dot));
        byte[] data = unbase64(value.substring(dot + 1));

        if (!MessageDigest.isEqual(mac, hmac(hmacKey, data))) {
            throw new IllegalStateException("Cookie signature verification failed");
        }
        return cls.cast(fromBytes(data));
    }

    private static byte[] toBytes(Serializable object) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(object);
            oos.flush();
            return bos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to serialize cookie value", e);
        }
    }

    private static Object fromBytes(byte[] data) {
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data))) {
            ois.setObjectInputFilter(SAFE_FILTER);
            return ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new IllegalStateException("Failed to deserialize cookie value", e);
        }
    }

    private static byte[] hmac(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(key, HMAC_ALGORITHM));
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute cookie signature", e);
        }
    }

    private static String base64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] unbase64(String value) {
        return Base64.getUrlDecoder().decode(value);
    }
}
