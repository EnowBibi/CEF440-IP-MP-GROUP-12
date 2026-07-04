package com.codewithpcodes.cardiag.youtube;

public record VideoResult(
      String videoId,
      String title,
      String channelName,
      String description,
      String thumbnailUrl,
      String videoUrl
) {

    public static VideoResult toVideoResult(YoutubeCache cache) {
        return new VideoResult(
                cache.getVideoId(),
                cache.getTitle(),
                cache.getChannelName(),
                cache.getDescription(),
                cache.getThumbnailUrl(),
                cache.getVideoUrl()
        );
    }

    public static VideoResult toVideoResult(YoutubeSearchResponse.YoutubeItemDTO item) {
        String videoId = item.getId().getVideoId();
        String thumbnailUrl = null;

        if (item.getSnippet().getThumbnails() != null) {
            if (item.getSnippet().getThumbnails().getHigh() != null) {
                thumbnailUrl = item.getSnippet().getThumbnails().getHigh().getUrl();
            } else if (item.getSnippet().getThumbnails().getMedium() != null) {
                thumbnailUrl = item.getSnippet().getThumbnails().getMedium().getUrl();
            }
        }

        return new VideoResult(
                videoId,
                item.getSnippet().getTitle(),
                item.getSnippet().getChannelTitle(),
                item.getSnippet().getDescription(),
                thumbnailUrl,
                "https://www.youtube.com/watch?v=" + videoId
        );
    }
}
