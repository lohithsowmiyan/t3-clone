import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MarkdownRenderer({ children }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ node, inline, className, children: codeChildren, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={dracula}
              PreTag="div"
              language={match[1]}
              customStyle={{
                lineHeight: "1.8",
                padding: "1em",
                borderRadius: "0.5em",
              }}
              {...props}
            >
              {String(codeChildren).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code
              className={className}
              style={{ lineHeight: "1.6" }}
              {...props}
            >
              {codeChildren}
            </code>
          );
        },

        p({ node, children, ...props }) {
          return (
            <p
              style={{
                marginBottom: "1.2rem",
                whiteSpace: "pre-line",
                lineHeight: "1.8",
              }}
              {...props}
            >
              {children}
            </p>
          );
        },

        // 🟢 Add spacing between bullet points
        li({ children, ...props }) {
          return (
            <li
              style={{
                marginBottom: "0.6rem", // adjust spacing here
                lineHeight: "1.6",
              }}
              {...props}
            >
              {children}
            </li>
          );
        },
      }}
    >
      {children}
    </Markdown>
  );
}
