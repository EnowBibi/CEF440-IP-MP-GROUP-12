package com.codewithpcodes.cardiag.diagnosis;

import com.codewithpcodes.cardiag.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("api/v1/diagnose")
@RequiredArgsConstructor
@Tag(name = "Diagnosis Management", description = "Diagnosis Management Endpoint")
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    /**
     * Runs the full diagnosis pipeline for an image, audio clip, or text description.
     * Sent as multipart/form-data so that IMAGE/AUDIO inputs can carry a file alongside
     * the {@code inputType}. The user is resolved from the JWT, not from the request body.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DiagnosisResponse> diagnose(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("inputType") InputType inputType,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text
    ) {
        String userId = currentUser != null ? String.valueOf(currentUser.getId()) : null;
        DiagnosisRequest request = new DiagnosisRequest(inputType, file, text, userId);

        log.info("Received diagnosis request. inputType={}, userId={}", inputType, userId);
        return ResponseEntity.ok(diagnosisService.diagnose(request));
    }
}
