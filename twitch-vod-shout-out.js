document.addEventListener("DOMContentLoaded", () => {
  try {
    const currentDomain = window.location.hostname;
    const params = new URLSearchParams(location.search);

    const client = new StreamerbotClient({
      host: params.get("host") || "127.0.0.1",
      port: parseInt(params.get("port"), 10) || 8080,
      endpoint: params.get("endpoint") || "/",
      password: params.get("password") || "",
      autoReconnect: true,
      immediate: true,
    });

    client.on("connection", (data) => {
      console.log("✅ StreamerbotClient verbunden:", data);
    });

    client.on("error", (error) => {
      console.error("❌ StreamerbotClient Fehler:", error);
    });

    const html = document.documentElement;
    const body = document.body;

    const fontFamilyVar = "--font-family-var";
    const robotoBold = getComputedStyle(html)
      .getPropertyValue(fontFamilyVar)
      .trim();

    const copy = "copy";
    const dragstart = "dragstart";
    const keydown = "keydown";
    const select = "select";

    function bodyToken() {
      if (robotoBold) body.style.fontFamily = robotoBold;

      const eventArray = [copy, dragstart, keydown, select];
      eventArray.forEach((event) => {
        if (!event) return;

        body.addEventListener(event, (e) => e.preventDefault());
      });
    }
    bodyToken();

    const twitchEmbedVodDiv =
      document.getElementById("twitchEmbedVodContainerId") ||
      document.querySelector("#twitchEmbedVodContainerId");

    if (!twitchEmbedVodDiv) {
      console.error(
        "❌ KRITISCH: twitchEmbedVodContainerId DOM-Element nicht gefunden!"
      );
      throw new Error("VOD Container nicht im DOM!");
    }

    function twitchDivToken() {
      if (robotoBold) twitchEmbedVodDiv.style.fontFamily = robotoBold;

      const eventArray = [copy, dragstart, keydown, select];
      eventArray.forEach((event) => {
        if (!event) return;

        twitchEmbedVodDiv.addEventListener(event, (e) => e.preventDefault());
      });
    }
    twitchDivToken();

    client.on("StreamElements.Connected", (data) => {
      console.log("🔌 StreamElements verbunden:", data);
    });

    client.on("Twitch.ShoutoutCreated", (data) => {
      console.log("📣 Twitch Shout-Out erstellt:", data);
    });

    client.on("Misc.GlobalVariableUpdated", ({ data }) => {
      console.log(
        "📢 Global Variable aktualisiert:",
        data.name,
        "=",
        data.newValue
      );

      if (data.name === "twitchShoutOutUserVodId") {
        try {
          const vodId =
            typeof data.newValue === "string"
              ? data.newValue.replace(/"/g, "").trim()
              : data.newValue;

          console.log("🎬 VOD-ID empfangen:", vodId);

          if (!vodId || vodId === "null" || vodId === "") {
            console.warn("⚠️ VOD-ID ist leer, überspringe...");
            return;
          }

          const video = "video";
          const width = 1920;
          const height = 1080;
          const autoplay = true;
          const theme = "dark";
          const muted = true;
          const volume = 0.5;
          const chunked = "chunked";
          const vodEmbed = "vod-embed";

          const oldScripts = twitchEmbedVodDiv.querySelectorAll("script");
          oldScripts.forEach((s) => s.remove());
          twitchEmbedVodDiv.innerHTML = "";

          console.log("🔄 Lade Twitch Player Script...");
          const script = document.createElement("script");
          script.src = "https://player.twitch.tv/js/embed/v1.js";

          script.addEventListener("load", () => {
            console.log(
              "✅ Twitch Player Script geladen, initialisiere Player..."
            );

            if (typeof window.Twitch === "undefined") {
              console.error("❌ Twitch Objekt nicht global verfügbar!");
              return;
            }

            try {
              const embed = new Twitch.Player(twitchEmbedVodDiv, {
                layout: video,
                video: vodId,
                width: width,
                height: height,
                autoplay: autoplay,
                theme: theme,
                parent: [currentDomain],
                muted: muted,
              });

              console.log("✅ Twitch Player erstellt");

              embed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
                console.log("✅ VOD ist bereit zum Abspielen");
                const player = embed.getPlayer();

                if (player) {
                  player.setVolume(volume);
                  player.setMuted(muted);
                  console.log(
                    "🔊 Volume auf",
                    volume,
                    "gesetzt, Muted:",
                    muted
                  );
                } else {
                  console.warn(
                    "⚠️ Player-Objekt konnte nicht abgerufen werden"
                  );
                }
              });

              embed.addEventListener(Twitch.Embed.READY, () => {
                console.log("✅ Twitch Embed ist vollständig bereit");
              });

              const iframe = twitchEmbedVodDiv.querySelector("iframe");
              if (iframe) {
                if (robotoBold) iframe.style.fontFamily = robotoBold;
                iframe.classList.add(vodEmbed);
                iframe.setAttribute("loading", "eager");
                console.log("✅ iframe konfiguriert:", iframe);
              } else {
                console.warn("⚠️ iframe konnte noch nicht gefunden werden");
              }
            } catch (playerError) {
              console.error(
                "❌ Fehler beim Erstellen des Players:",
                playerError
              );
            }
          });

          script.addEventListener("error", (e) => {
            console.error("❌ Fehler beim Laden des Twitch Player Scripts:", e);
          });

          console.log("📥 Hänge Script ins DOM ein...");
          twitchEmbedVodDiv.appendChild(script);
        } catch (error) {
          console.error("Fehler bei VOD-Verarbeitung:", error);
        }
      }

      if (data.name === "twitchShoutOutVodDuration") {
        try {
          const vodDuration =
            typeof data.newValue === "string"
              ? parseInt(data.newValue.replace(/"/g, ""), 10)
              : parseInt(data.newValue, 10);

          console.log("⏱️ VOD-Dauer empfangen:", vodDuration, "ms");

          if (vodDuration > 0) {
            const iframe = twitchEmbedVodDiv.querySelector("iframe");
            if (iframe) {
              console.log("⏰ Starte Timer für", vodDuration, "ms");
              setTimeout(() => {
                console.log("⏹️ VOD-Dauer abgelaufen, verstecke Player");
                iframe.src = "";
                twitchEmbedVodDiv.innerHTML = "";
              }, vodDuration);
            }
          }
        } catch (error) {
          console.error("Fehler bei VOD-Duration:", error);
        }
      }
    });
  } catch (error) {
    console.log("Fehler:", error);
  }
});
