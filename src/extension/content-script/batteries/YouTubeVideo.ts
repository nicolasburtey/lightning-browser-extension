import getOriginData from "../originData";
import { findLnurlFromYouTubeAboutPage } from "./YouTubeChannel";
import {
  findLightningAddressInText,
  resetLightningData,
  setLightningData,
} from "./helpers";

const urlMatcher = /^https:\/\/www\.youtube.com\/watch.*/;

declare global {
  interface Window {
    ALBY_BATTERY: boolean;
  }
}

const setData = async (): Promise<void> => {
  let text = "";
  document
    .querySelectorAll(
      "#columns #primary #primary-inner #meta-contents #description .content"
    )
    .forEach((e) => {
      text += ` ${e.textContent}`;
    });
  const channelLink = document.querySelector<HTMLAnchorElement>(
    "#columns #primary #primary-inner #meta-contents .ytd-channel-name a"
  );
  if (!text || !channelLink) {
    return;
  }
  let match;
  let lnurl;
  // check for an lnurl
  if ((match = text.match(/(lnurlp:)(\S+)/i))) {
    lnurl = match[2];
  }
  // if there is no lnurl we check for a zap emoji with a lightning address
  // we check for the @-sign to try to limit the possibility to match some invalid text (e.g. random emoji usage)
  else if ((match = findLightningAddressInText(text))) {
    lnurl = match;
  } else {
    // load the about page to check for a lightning address
    const match = channelLink.href.match(
      /^https:\/\/www\.youtube.com\/(((channel|c)\/([^/]+))|(@[^/]+)).*/
    );
    if (match) {
      lnurl = await findLnurlFromYouTubeAboutPage(match[1]);
    }
  }

  if (!lnurl) return;

  const name = channelLink.textContent || "";
  const imageUrl =
    document.querySelector<HTMLImageElement>(
      "#columns #primary #primary-inner #meta-contents img"
    )?.src ||
    document.querySelector<HTMLImageElement>(
      "#columns #primary #primary-inner #owner #avatar img" // support maybe new UI being rolled out 2022/09
    )?.src ||
    "";
  setLightningData([
    {
      method: "lnurl",
      address: lnurl,
      ...getOriginData(),
      name,
      description: "", // we can not reliably find a description (the meta tag might be of a different video)
      icon: imageUrl,
    },
  ]);
};

const battery = async (): Promise<void> => {
  function waitForDescription() {
    const description = document.querySelector(
      "div#bottom-row.style-scope.ytd-watch-metadata"
    );
    if (description) {
      clearInterval(descriptionInterval); // Stop checking for the element

      if (!window.ALBY_BATTERY) {
        window.ALBY_BATTERY = true;
        setData();
      }

      const observer = new MutationObserver(() => {
        resetLightningData();
        setData();
      });

      observer.observe(description, { childList: true, subtree: true });
    }
  }

  const descriptionInterval = setInterval(waitForDescription, 100);
  setTimeout(() => clearInterval(descriptionInterval), 2000);
};

const YouTubeVideo = {
  urlMatcher,
  battery,
};

export default YouTubeVideo;
