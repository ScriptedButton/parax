import {
  Button,
  Card,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  TextInput,
  ActionIcon,
  Paper,
  Indicator,
  ScrollArea,
  FileButton,
} from "@mantine/core";
import { type FC, useEffect, useState } from "react";
import { TbUpload } from "react-icons/tb";
import { LoaderStatus } from "~/components/chat/LoadingStatus";
import type { ProgressItem } from "~/components/chat/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string | null;
}

interface StatusProps {
  messages: Message[];
  tps: number | null;
  numTokens: number | null;
  imageProgress: number | null;
  imageGenerationTime: number | null;
  isRunning: boolean;
  setMessages: (messages: Message[]) => void;
}

const Status: FC<StatusProps> = ({
  messages,
  tps,
  numTokens,
  imageProgress,
  imageGenerationTime,
  isRunning,
}) => {
  return (
    <Text ta="center">
      {messages.length > 0 && (
        <>
          {tps ? (
            <>
              {!isRunning && (
                <Text span>
                  Generated {numTokens} tokens in{" "}
                  {((numTokens || 0) / tps).toFixed(2)} seconds&nbsp;&#40;
                </Text>
              )}
              <Text span>{tps.toFixed(2)}</Text>
              <Text span className="text-gray-500 dark:text-gray-300">
                tokens/second
              </Text>
              {!isRunning && (
                <Text span className="mr-1">
                  &#41;.
                </Text>
              )}
            </>
          ) : (
            imageProgress && (
              <Group>
                {isRunning ? (
                  <>
                    <Text span>Generating image...</Text>&nbsp;&#40;
                    <Text
                      span
                      className="font-medium font-mono text-center text-black dark:text-white"
                    >
                      {(imageProgress * 100).toFixed(2)}%
                    </Text>
                    <Text span className="mr-1">
                      &#41;
                    </Text>
                  </>
                ) : (
                  <Text span>
                    Generated image in{" "}
                    {((imageGenerationTime || 0) / 1000).toFixed(2)}{" "}
                    seconds.&nbsp;
                  </Text>
                )}
              </Group>
            )
          )}
        </>
      )}
    </Text>
  );
};

type WorkerStatus = "idle" | "loading" | "ready" | null;

export default function Multi() {
  const [workerInstance, setWorkerInstance] = useState<Worker | undefined>();
  const [status, setStatus] = useState<WorkerStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [imageGenerationTime, setImageGenerationTime] = useState<number | null>(
    null,
  );

  function onEnter(message: string, img: string | null) {
    setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", content: message, image: img ?? image },
    ]);
    setTps(null);
    setIsRunning(true);
    setInput("");
    setImage(null);
    setNumTokens(null);
    setImageProgress(null);
    setImageGenerationTime(null);
  }

  useEffect(() => {
    if (!workerInstance) {
      console.log("Initializing worker...");
      const worker = new Worker(
        new URL("../janus-worker.js", import.meta.url),
        {
          type: "module",
        },
      );

      worker.postMessage({ type: "check" });
      setWorkerInstance(worker);
    }
  }, []);

  useEffect(() => {
    console.log("Worker initialized");

    type WorkerMessage = {
      status: string;
      data?: any;
      file?: string;
      output?: string;
      tps?: number;
      numTokens?: number;
      blob?: Blob;
      progress?: number;
      time?: number;
      total?: number;
      loaded?: number;
    };

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      switch (e.data.status) {
        case "success":
          setStatus("idle");
          break;
        case "error":
          setError(e.data.data);
          break;
        case "loading":
          setStatus("loading");
          setLoadingMessage(e.data.data);
          break;
        case "initiate":
          setProgressItems((prev) => [...prev, e.data as ProgressItem]);
          break;

        case "progress":
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, ...e.data };
              }
              return item;
            }),
          );
          break;
        case "done":
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file),
          );
          break;
        case "ready":
          setStatus("ready");
          break;
        case "start":
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
          break;
        case "text-update":
          const { output, tps, numTokens } = e.data;
          setTps(tps || null);
          setNumTokens(numTokens || null);
          setMessages((prev) => {
            const cloned = [...prev];
            const last = cloned[cloned.length - 1];
            if (last) {
              cloned[cloned.length - 1] = {
                ...last,
                content: last.content + (output || ""),
              };
            }
            return cloned;
          });
          break;
        case "image-update":
          const { blob, progress, time } = e.data;
          if (blob) {
            const url = URL.createObjectURL(blob);
            setMessages((prev) => {
              const cloned = [...prev];
              const last = cloned[cloned.length - 1];
              if (last) {
                cloned[cloned.length - 1] = {
                  ...last,
                  image: url,
                };
              }
              return cloned;
            });
          } else {
            setImageProgress(progress || null);
            setImageGenerationTime(time || null);
          }
          break;
        case "complete":
          setIsRunning(false);
          break;
      }
    };

    const onErrorReceived = (e: ErrorEvent) => {
      console.error("Worker error:", e);
    };

    workerInstance?.addEventListener("message", onMessageReceived);
    workerInstance?.addEventListener("error", onErrorReceived);

    return () => {
      workerInstance?.removeEventListener("message", onMessageReceived);
      workerInstance?.removeEventListener("error", onErrorReceived);
    };
  }, [workerInstance]);

  useEffect(() => {
    if (messages.filter((x) => x.role === "user").length === 0) {
      return;
    }
    if (messages[messages.length - 1]?.role === "assistant") {
      return;
    }
    setTps(null);
    workerInstance?.postMessage({ type: "generate", data: messages });
  }, [messages, isRunning]);

  return (
    <Stack
      align="stretch"
      flex={1}
      p={0}
      h="100%"
      style={{
        overflowY: "hidden",
      }}
    >
      <Card withBorder>
        <Stack flex={1} h="100%">
          <Group justify="space-between" align="center">
            <Title order={4}>Multi-Modal LLM</Title>
            <Status
              messages={messages}
              tps={tps}
              numTokens={numTokens}
              imageProgress={imageProgress}
              imageGenerationTime={imageGenerationTime}
              isRunning={isRunning}
              setMessages={setMessages}
            />
          </Group>
          {!isRunning && messages.length > 0 && (
            <Group justify="flex-end">
              <Button
                className="underline cursor-pointer"
                onClick={() => setMessages([])}
              >
                Clear
              </Button>
            </Group>
          )}
          {(status === null || status === "idle") && messages.length === 0 && (
            <Group>
              <Button
                onClick={() => {
                  workerInstance?.postMessage({ type: "load" });
                  setStatus("loading");
                }}
                disabled={status === null}
              >
                {status === null ? "Running feature checks..." : "Load model"}
              </Button>
            </Group>
          )}
        </Stack>
      </Card>
      {status === "ready" && (
        <Stack style={{ overflow: "hidden" }} gap="sm" flex={1}>
          <ScrollArea flex={1} h="100%">
            <Stack>
              {messages.map((message, i) => (
                <Card withBorder key={i} radius="lg">
                  <Stack
                    gap="md"
                    align={message.role === "user" ? "flex-end" : "flex-start"}
                  >
                    <Badge>{message.role}</Badge>
                    <Text>{message.content}</Text>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Generated image"
                        className={`min-w-20 min-h-20 relative p-2 ${
                          message.role === "user" ? "w-20 h-20" : undefined
                        }`}
                      />
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
          <Stack>
            {image && (
              <Paper p="md" radius="lg" withBorder>
                <Indicator>
                  <img
                    src={image}
                    alt="Generated image"
                    style={{
                      objectFit: "cover",
                    }}
                    className="h-20 w-28 border-gray-300/20 hover:border-border-300/30 transition relative -mb-1 rounded-[0.625rem] border-2"
                  />
                </Indicator>
              </Paper>
            )}
            <Group grow>
              <TextInput
                size="lg"
                placeholder="Enter your message..."
                value={input}
                flex={1}
                style={{
                  zIndex: 1,
                }}
                leftSection={
                  <FileButton
                    onChange={(file: File | null) => {
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (e: ProgressEvent<FileReader>) => {
                        const result = e.target?.result;
                        if (typeof result === "string") {
                          setImage(result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  >
                    {(props) => (
                      <ActionIcon {...props} mx="md">
                        <TbUpload />
                      </ActionIcon>
                    )}
                  </FileButton>
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (
                    input.length > 0 &&
                    !isRunning &&
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    onEnter(input, image);
                  }
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInput(e.currentTarget.value)
                }
                disabled={status !== "ready"}
              />
            </Group>
          </Stack>
        </Stack>
      )}
      {status === "loading" && (
        <LoaderStatus
          loadingMessage={loadingMessage}
          progressItems={progressItems}
        />
      )}
      {error && (
        <Card withBorder>
          <Text c="red">{error}</Text>
        </Card>
      )}
    </Stack>
  );
}
