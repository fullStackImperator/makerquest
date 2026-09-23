<?php
/**
 * MakerQuest H5P xAPI bridge.
 *
 * Install this on the WordPress site that hosts your H5P content, either as a
 * mu-plugin (drop it in wp-content/mu-plugins/) or paste the add_filter block
 * into a "Code Snippets" style plugin.
 *
 * It injects a small script INTO the H5P iframe (via the h5p-wordpress-plugin
 * `h5pmods_additional_head_tags` filter). The script listens for H5P xAPI
 * events and forwards the statement to the embedding MakerQuest page through
 * window.parent.postMessage. MakerQuest validates the origin and records the
 * score into the learner's exercise attempt.
 *
 * IMPORTANT: replace MAKERQUEST_ORIGIN with your deployed MakerQuest origin
 * (scheme + host, no trailing slash), e.g. "https://app.makerquest.example".
 * Using a concrete origin (never "*") keeps the score from leaking to other
 * embedders. xAPIKatchu can stay enabled; it stores statements locally and
 * operates independently of this bridge.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('MAKERQUEST_ORIGIN')) {
    define('MAKERQUEST_ORIGIN', 'https://YOUR-MAKERQUEST-ORIGIN');
}

add_filter('h5pmods_additional_head_tags', function ($tags) {
    $origin = wp_json_encode(MAKERQUEST_ORIGIN);

    $tags[] = '<script>
    (function () {
      var targetOrigin = ' . $origin . ';
      function attach() {
        if (!window.H5P || !H5P.externalDispatcher) {
          return window.setTimeout(attach, 200);
        }
        H5P.externalDispatcher.on("xAPI", function (event) {
          try {
            var statement = event && event.data && event.data.statement;
            if (!statement || !statement.result || !statement.result.score) {
              return;
            }
            window.parent.postMessage(
              { source: "h5p", statement: statement },
              targetOrigin
            );
          } catch (e) {
            /* swallow: never break the activity because of reporting */
          }
        });
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attach);
      } else {
        attach();
      }
    })();
    </script>';

    return $tags;
});
