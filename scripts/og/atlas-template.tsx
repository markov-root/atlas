/** @jsxRuntime automatic */
/** @jsxImportSource satori/jsx */

const BLUE = "#2563eb";

const Wordmark = ({ mark }: { mark: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
    }}
  >
    <img src={mark} width={36} height={36} />
    <div
      style={{
        fontSize: 24,
        fontFamily: "Righteous",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      AI Safety Atlas
    </div>
  </div>
);

export default {
  fonts: [
    { family: "Righteous", weights: [400] },
    { family: "Jost", weights: [400, 500] },
  ],
  assets: {
    mark: "atlas-mark-white.svg",
    bg: "atlas-bg.png",
  },
  templates: {
    og: {
      width: 1200,
      height: 630,
      variables: {
        title: { default: "The open textbook for AI Safety" },
        description: {
          default:
            "Written by Markov Grey and Charbel-Raphael Segerie from the French Center for AI Safety.",
        },
      },
      render: (
        { title, description }: { title: string; description: string },
        assets: { mark: string; bg: string },
      ) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            color: "#ffffff",
            fontFamily: "Jost",
            padding: "60px 72px",
          }}
        >
          <img
            src={assets.bg}
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
          <Wordmark mark={assets.mark} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flexGrow: 1,
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                fontSize: title.length > 60 ? 48 : title.length > 35 ? 56 : 68,
                fontFamily: "Righteous",
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 400,
                  opacity: 0.95,
                  marginTop: 24,
                  lineHeight: 1.5,
                  maxWidth: 600,
                }}
              >
                {description}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 20,
              opacity: 0.7,
            }}
          >
            ai-safety-atlas.com
          </div>
        </div>
      ),
    },

    section: {
      width: 1200,
      height: 630,
      variables: {
        eyebrow: { default: "Chapter 3: Strategies" },
        title: { default: "ASI Safety Strategies" },
        description: { default: "" },
        audio: { default: "" },
        edition: { default: "Edition 1" },
      },
      render: (
        { eyebrow, title, description, audio, edition }: {
          eyebrow: string;
          title: string;
          description: string;
          audio: boolean;
          edition: string;
        },
        assets: { mark: string; bg: string },
      ) => (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#ffffff",
            color: "#1a1a1a",
            fontFamily: "Jost",
          }}
        >
          {/* Blue left strip */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "360px",
              color: "#ffffff",
              padding: "60px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img
              src={assets.bg}
              width={360}
              height={630}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
            <Wordmark mark={assets.mark} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: 16, opacity: 0.7 }}>{edition}</div>
              <div style={{ fontSize: 16, opacity: 0.7 }}>
                ai-safety-atlas.com
              </div>
            </div>
          </div>

          {/* Content area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flexGrow: 1,
              padding: "60px 64px",
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: BLUE,
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                fontSize: title.length > 30 ? 42 : 52,
                fontFamily: "Righteous",
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: 20,
                  color: "#4b5563",
                  marginTop: 20,
                  lineHeight: 1.5,
                  maxWidth: 580,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {description.length > 180
                  ? description.slice(0, 180).replace(/\s+\S*$/, "") + "..."
                  : description}
              </div>
            )}
            {audio && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: 56,
                  fontSize: 18,
                  color: BLUE,
                  fontWeight: 500,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={BLUE}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                Audio available
              </div>
            )}
          </div>
        </div>
      ),
    },
  },
};
