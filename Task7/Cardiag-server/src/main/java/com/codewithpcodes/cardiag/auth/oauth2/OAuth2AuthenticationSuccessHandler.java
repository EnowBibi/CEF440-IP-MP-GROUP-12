package com.codewithpcodes.cardiag.auth.oauth2;


import com.codewithpcodes.cardiag.config.JwtService;
import com.codewithpcodes.cardiag.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;
    private final OAuth2RedirectResolver redirectResolver;

    @Value("${application.oauth2.redirect-url}")
    private String defaultRedirectUrl;

    @Override
    public void onAuthenticationSuccess(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();
        assert principal != null;
        User user = principal.getUser();

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        String baseRedirect = redirectResolver.resolve(request, defaultRedirectUrl);

        String targetUrl = UriComponentsBuilder.fromUriString(baseRedirect)
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build()
                .toUriString();

        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        log.info("OAuth2 login success for user: {} -> {}", user.getEmail(), baseRedirect);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
