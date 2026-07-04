package com.codewithpcodes.cardiag.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

/**
 * Persists the in-flight OAuth2 authorization request in short-lived, HMAC-signed
 * cookies instead of the HTTP session. This is required because the security config
 * is stateless ({@code SessionCreationPolicy.STATELESS}); without it the default
 * session-backed repository loses the request during the round-trip to Google and
 * login fails with "authorization_request_not_found".
 *
 * It also captures a client-supplied {@code redirect_uri} query parameter so the
 * success/failure handlers can return the user to the right place (web origin or
 * native app deep link).
 */
@Slf4j
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE = "oauth2_auth_request";
    public static final String REDIRECT_URI_COOKIE = "oauth2_redirect_uri";
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    /** Reuse the JWT secret to sign the auth-request cookie. */
    @Value("${application.security.jwt.secret}")
    private String signingSecret;

    private byte[] signingKey() {
        return signingSecret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE)
                .map(cookie -> {
                    try {
                        return CookieUtils.deserialize(
                                cookie, OAuth2AuthorizationRequest.class, signingKey());
                    } catch (RuntimeException e) {
                        // Tampered/forged/expired cookie — treat as no request present.
                        log.warn("Discarding invalid OAuth2 auth-request cookie: {}", e.getMessage());
                        return null;
                    }
                })
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            removeAuthorizationRequestCookies(request, response);
            return;
        }

        CookieUtils.addCookie(
                response,
                OAUTH2_AUTHORIZATION_REQUEST_COOKIE,
                CookieUtils.serialize(authorizationRequest, signingKey()),
                COOKIE_EXPIRE_SECONDS
        );

        String redirectUriAfterLogin = request.getParameter("redirect_uri");
        if (StringUtils.hasText(redirectUriAfterLogin)) {
            CookieUtils.addCookie(
                    response,
                    REDIRECT_URI_COOKIE,
                    redirectUriAfterLogin,
                    COOKIE_EXPIRE_SECONDS
            );
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        // The auth request cookie is cleared later by the success/failure handler
        // (after it has read the redirect_uri cookie), so just return the value here.
        return loadAuthorizationRequest(request);
    }

    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE);
        CookieUtils.deleteCookie(request, response, REDIRECT_URI_COOKIE);
    }
}
