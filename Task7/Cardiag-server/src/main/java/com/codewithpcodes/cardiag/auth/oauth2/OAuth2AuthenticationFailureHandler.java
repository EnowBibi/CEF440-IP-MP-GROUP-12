package com.codewithpcodes.cardiag.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
@RequiredArgsConstructor
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;
    private final OAuth2RedirectResolver redirectResolver;

    @Value("${application.oauth2.redirect-url}")
    private String defaultRedirectUrl;

    @Override
    public void onAuthenticationFailure(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        String baseRedirect = redirectResolver.resolve(request, defaultRedirectUrl);
        String error = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);

        String targetUrl = UriComponentsBuilder
                .fromUriString(baseRedirect)
                .queryParam("error", error)
                .build()
                .toUriString();

        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        log.error("OAuth2 login failed: {}", exception.getMessage());
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
