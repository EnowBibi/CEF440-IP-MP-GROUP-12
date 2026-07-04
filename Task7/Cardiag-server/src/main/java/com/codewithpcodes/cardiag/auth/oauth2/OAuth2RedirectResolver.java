package com.codewithpcodes.cardiag.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;

/**
 * Resolves where to send the user after an OAuth2 login. Uses the client-supplied
 * {@code redirect_uri} (stashed in a cookie) when it matches an allowlisted target,
 * otherwise falls back to the configured default. The allowlist prevents the
 * handler from being abused as an open redirect.
 */
@Slf4j
@Component
public class OAuth2RedirectResolver {

    @Value("${application.oauth2.authorized-redirect-uris}")
    private String[] authorizedRedirectUris;

    public String resolve(HttpServletRequest request, String defaultUrl) {
        return CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_COOKIE)
                .map(jakarta.servlet.http.Cookie::getValue)
                .filter(this::isAuthorized)
                .orElse(defaultUrl);
    }

    private boolean isAuthorized(String uri) {
        try {
            URI requested = URI.create(uri);
            for (String allowed : authorizedRedirectUris) {
                if (matches(URI.create(allowed.trim()), requested)) {
                    return true;
                }
            }
        } catch (IllegalArgumentException e) {
            log.warn("Rejected malformed redirect_uri: {}", uri);
        }
        log.warn("Rejected unauthorized redirect_uri: {}", uri);
        return false;
    }

    /** Match on scheme + host + port; the path may legitimately differ. */
    private boolean matches(URI allowed, URI requested) {
        boolean sameScheme = equalsIgnoreCase(allowed.getScheme(), requested.getScheme());
        boolean sameHost = equalsIgnoreCase(allowed.getHost(), requested.getHost());
        boolean samePort = allowed.getPort() == requested.getPort();
        return sameScheme && sameHost && samePort;
    }

    private boolean equalsIgnoreCase(String a, String b) {
        return a != null && a.equalsIgnoreCase(b);
    }
}
