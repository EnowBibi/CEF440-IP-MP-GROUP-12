package com.codewithpcodes.cardiag.diagnosis;

import com.codewithpcodes.cardiag.embedding.VectorSearchService;
import com.codewithpcodes.cardiag.fault.Fault;
import com.codewithpcodes.cardiag.openai.FaultContext;
import com.codewithpcodes.cardiag.openai.OpenAiService;
import com.codewithpcodes.cardiag.user.User;
import com.codewithpcodes.cardiag.user.UserRepository;
import com.codewithpcodes.cardiag.youtube.VideoResult;
import com.codewithpcodes.cardiag.youtube.YoutubeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * @author pcodes
 * Core orchestrator of the full diagnosis pipeline.
 *
 * Complete flow:
 *
 *  Step 1 — Describe input
 *    IMAGE → OpenAiService.describeImage() → text
 *    AUDIO → OpenAiService.describeAudio() → text
 *    TEXT  → used directly
 *
 *  Step 2 — Hash input for deduplication
 *    If an identical input was already processed, return cached result
 *
 *  Step 3 — Embed the description
 *    text → OpenAiService.embedQuery() → float[]
 *
 *  Step 4 — Search pgvector
 *    float[] → VectorSearchService.findBestMatch() → Optional<Fault>
 *
 *  Step 5 — Generate LLM report
 *    fault context + input description → GPT-4o → llmReport
 *
 *  Step 6 — Fetch YouTube videos
 *    faultId → YoutubeService → List<VideoResult>
 *
 *  Step 7 — Save Diagnosis entity to PostgreSQL
 *    All of the above → Diagnosis entity → DB
 *
 *  Step 8 — Return DiagnosisResponse to controller
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiagnosisService {

    private final OpenAiService openAiService;
    private final VectorSearchService vectorSearchService;
    private final YoutubeService youtubeService;
    private final DiagnosisRepository diagnosisRepository;
    private final UserRepository userRepository;


    public DiagnosisResponse diagnose(DiagnosisRequest request) {
        log.info("Starting diagnosis. InputType={}, userId={}",
                request.inputType(), request.userId());

        // Step 1 — Get text description of the input
        String inputDescription = describeInput(request);
        log.debug("Input description: {}", inputDescription);

        // Step 2 — Fingerprint the input. We intentionally do NOT deduplicate:
        // every scan is recorded as its own diagnosis so users can run many and
        // delete them individually. A random suffix keeps the value unique even
        // when two scans produce an identical description.
        String inputHash = hashText(inputDescription) + "-" + UUID.randomUUID();

        // Step 3 — Embed the description
        float[] embedding = openAiService.embedQuery(inputDescription);
        log.debug("Embedding generated. Dimensions: {}", embedding.length);

        // Step 4 — Search pgvector
        // Take the nearest fault regardless of the confidence threshold, so the
        // user always gets the closest known fault and its tutorials to start with.
        Optional<Fault> matchedFault = vectorSearchService.findNearestMatch(embedding);

        // Step 5 — Truly unrecognised only when nothing in the DB matched at all
        if (matchedFault.isEmpty()) {
            log.warn("No fault embeddings matched the query at all.");
            saveUnrecognisedDiagnosis(request, inputDescription, inputHash);
            return buildUnrecognisedResponse(inputDescription, request.inputType());
        }

        Fault fault = matchedFault.get();
        double confidence = vectorSearchService.getLastConfidenceScore();
        double distance   = vectorSearchService.getLastDistance();
        boolean confident = vectorSearchService.lastMatchAboveThreshold();

        log.info("Nearest fault: id='{}', name='{}', confidence={}, confident={}",
                fault.getId(), fault.getName(), confidence, confident);

        // Step 6 — Generate LLM report using fault context
        FaultContext context = buildFaultContext(fault);
        String llmReport = generateReport(inputDescription, context);

        // Step 7 — Fetch YouTube videos (always, even on low-confidence matches)
        List<VideoResult> videos = fetchVideos(fault.getId());

        // Step 8 — Save Diagnosis to DB
        Diagnosis diagnosis = saveDiagnosis(
                request, fault, inputDescription,
                inputHash, llmReport,
                confidence, distance
        );

        log.info("Diagnosis saved. id={}", diagnosis.getId());

        return buildSuccessResponse(fault, videos, llmReport, confidence, confident);
    }


    private String describeInput(DiagnosisRequest request) {
        return switch (request.inputType()) {
            case IMAGE -> openAiService.describeImage(request.file());
            case AUDIO -> openAiService.describeAudio(request.file());
            case TEXT  -> request.text();
        };
    }


    private String generateReport(String inputDescription, FaultContext context) {
        try {
            return openAiService.generateDiagnosisReport(inputDescription, context);
        } catch (Exception e) {
            log.warn("LLM report generation failed: {}. Falling back to raw fault data.", e.getMessage());
            return null;
        }
    }

    private FaultContext buildFaultContext(Fault fault) {
        return new FaultContext(
                fault.getId(),
                fault.getName(),
                fault.getCategory().name(),
                fault.getDescription(),
                fault.getUrgency().name(),
                fault.getCauses(),
                fault.getSymptoms(),
                fault.getRepairTips()
        );
    }

    private List<VideoResult> fetchVideos(String faultId) {
        try {
            return youtubeService.getVideosForFault(faultId);
        } catch (Exception e) {
            log.warn("Failed to fetch YouTube videos for fault '{}': {}", faultId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private Diagnosis saveDiagnosis(
            DiagnosisRequest request,
            Fault fault,
            String inputDescription,
            String inputHash,
            String llmReport,
            double confidence,
            double distance
    ) {
        // Populate the right description field based on input type
        Diagnosis diagnosis = Diagnosis.builder()
                .user(resolveUser(request))
                .inputType(request.inputType())
                .matchedFault(fault)
                .confidence(confidence)
                .distance(distance)
                .llmReport(llmReport)
                .isLowConfidence(confidence < 0.80)
                .rawInputHash(inputHash)
                .combinedContext(buildCombinedContext(inputDescription, fault))
                .build();

        // Set the correct description field
        switch (request.inputType()) {
            case IMAGE -> diagnosis.setImageDescription(inputDescription);
            case AUDIO -> diagnosis.setAudioTranscription(inputDescription);
            case TEXT  -> diagnosis.setUserText(inputDescription);
        }

        return diagnosisRepository.save(diagnosis);
    }


    private Diagnosis saveUnrecognisedDiagnosis(
            DiagnosisRequest request,
            String inputDescription,
            String inputHash
    ) {
        Diagnosis diagnosis = Diagnosis.builder()
                .user(resolveUser(request))
                .inputType(request.inputType())
                .matchedFault(null)
                .confidence(null)
                .distance(null)
                .isLowConfidence(true)
                .rawInputHash(inputHash)
                .build();

        switch (request.inputType()) {
            case IMAGE -> diagnosis.setImageDescription(inputDescription);
            case AUDIO -> diagnosis.setAudioTranscription(inputDescription);
            case TEXT  -> diagnosis.setUserText(inputDescription);
        }

        return diagnosisRepository.save(diagnosis);
    }

    /** Resolves the signed-in user from the request, or null for guests. */
    private User resolveUser(DiagnosisRequest request) {
        if (request.userId() == null) {
            return null;
        }
        return userRepository.findById(Integer.valueOf(request.userId()))
                .orElse(null);
    }


    private DiagnosisResponse buildSuccessResponse(
            Fault fault,
            List<VideoResult> videos,
            String llmReport,
            double confidence,
            boolean confident
    ) {
        return DiagnosisResponse.builder()
                .faultId(fault.getId())
                .faultName(fault.getName())
                .category(fault.getCategory().name())
                .description(fault.getDescription())
                .urgency(fault.getUrgency().name())
                .causes(fault.getCauses())
                .symptoms(fault.getSymptoms())
                .repairTips(fault.getRepairTips())
                .confidenceScore(confidence)
                .confidenceLabel(resolveConfidenceLabel(confidence))
                .llmReport(llmReport)
                .videos(videos)
                .recognised(true)
                .message(confident
                        ? null
                        : "We're not fully confident in this match. Here's the closest "
                          + "known fault and some tutorials to get you started.")
                .build();
    }

    private DiagnosisResponse buildUnrecognisedResponse(
            String inputDescription,
            InputType inputType
    ) {
        String message = switch (inputType) {
            case IMAGE -> "No matching warning light was recognised. " +
                    "Ensure the dashboard is clearly visible and well lit, then try again.";
            case AUDIO -> "The engine sound could not be matched to a known fault. " +
                    "Try recording for at least 10 seconds with the phone close to the engine.";
            case TEXT  -> "The described problem could not be matched to a known fault. " +
                    "Try describing the symptoms in more detail.";
        };

        return DiagnosisResponse.builder()
                .recognised(false)
                .inputDescription(inputDescription)
                .message(message)
                .videos(Collections.emptyList())
                .causes(Collections.emptyList())
                .symptoms(Collections.emptyList())
                .repairTips(Collections.emptyList())
                .build();
    }


    private String buildCombinedContext(String inputDescription, Fault fault) {
        return String.format(
                "Input: %s | Fault: %s | Urgency: %s | Causes: %s",
                inputDescription,
                fault.getName(),
                fault.getUrgency().name(),
                String.join(", ", fault.getCauses())
        );
    }


    private String resolveConfidenceLabel(double score) {
        if (score >= 0.90) return "HIGH";
        if (score >= 0.75) return "MEDIUM";
        return "LOW";
    }

    private String hashText(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return String.valueOf(text.hashCode());
        }
    }
}

