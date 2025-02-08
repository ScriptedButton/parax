// Imports
import {
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Title,
  Text,
  Badge,
  Textarea,
  FileButton,
  TextInput,
  ActionIcon,
  Flex,
  Box,
  Image,
  Paper,
  Indicator,
  ScrollArea,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { TbUpload } from "react-icons/tb";

interface StatusProps {
  messages: any[];
  tps: number;
  numTokens: number;
  imageProgress: number;
  imageGenerationTime: number;
  isRunning: boolean;
  setMessages: (messages: any[]) => void;
}

const Status = (props: StatusProps) => {
  const {
    messages,
    tps,
    numTokens,
    imageProgress,
    imageGenerationTime,
    isRunning,
    setMessages,
  } = props;

  return (
    <Text ta={"center"}>
      {messages.length > 0 && (
        <>
          {tps ? (
            <>
              {!isRunning && (
                <Text span>
                  Generated {numTokens} tokens in {(numTokens / tps).toFixed(2)}{" "}
                  seconds&nbsp;&#40;
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
                    Generated image in {(imageGenerationTime / 1000).toFixed(2)}{" "}
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

export default function Multi() {
  // State
  const [modelLoaded, setModelLoaded] = useState(false);
  const [workerInstance, setWorkerInstance] = useState<Worker>();

  // Model loading and progress
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // IO
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState<File | null>(null);
  const [tps, setTps] = useState(null);
  const [numTokens, setNumTokens] = useState(null);
  const [imageProgress, setImageProgress] = useState(null);
  const [imageGenerationTime, setImageGenerationTime] = useState(null);

  function onEnter(message, img) {
    setMessages((prev) => [
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

  // Initialization
  useEffect(() => {
    // If the worker is not already initialized, update the state
    if (!workerInstance) {
      console.log("Initializing worker...");
      const worker = new Worker(
        new URL("../janus-worker.js", import.meta.url),
        {
          type: "module",
        },
      );

      worker.postMessage({ type: "check" }); // Do a feature check

      setWorkerInstance(worker);
    }
  }, []);

  // Worker event listeners
  useEffect(() => {
    console.log("Worker initialized");

    // Callback function for Worker messages
    const onMessageReceived = (e) => {
      console.log("Message received", e.data);
      switch (e.data.status) {
        // WebGPU feature checking
        case "success":
          setStatus("idle");
          break;
        case "error":
          console.log("Error", e.data.data);
          setError(e.data.data);
          break;

        case "loading":
          // Model file start load: add a new progress item to the list.
          console.log("Loading", e.data.data);
          setStatus("loading");
          setLoadingMessage(e.data.data);
          break;

        case "initiate":
          console.log("Initiate", e.data);
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
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
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file),
          );
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setStatus("ready");
          break;

        case "start":
          {
            console.log("Start", e.data);
            // Start generation
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "" },
            ]);
          }
          break;

        case "text-update":
          // Generation update: update the output text.
          // Parse messages
          console.log("Text update", e.data);
          const { output, tps, numTokens } = e.data;
          setTps(tps);
          setNumTokens(numTokens);
          setMessages((prev) => {
            const cloned = [...prev];
            const last = cloned.at(-1);
            cloned[cloned.length - 1] = {
              ...last,
              content: last.content + output,
            };
            return cloned;
          });
          break;

        case "image-update":
          const { blob, progress, time } = e.data;

          if (blob) {
            // Add image to the last message
            const url = URL.createObjectURL(blob);
            setMessages((prev) => {
              const cloned = [...prev];
              const last = cloned.at(-1);
              cloned[cloned.length - 1] = {
                ...last,
                image: url,
              };
              return cloned;
            });
          } else {
            setImageProgress(progress);
            setImageGenerationTime(time);
          }
          break;

        case "complete":
          // Generation complete: re-enable the "Generate" button
          setIsRunning(false);
          break;
      }
    };

    const onErrorReceived = (e) => {
      console.error("Worker error:", e);
    };

    // Attach the callback function as an event listener.
    workerInstance?.addEventListener("message", onMessageReceived);
    workerInstance?.addEventListener("error", onErrorReceived);

    // Define a cleanup function for when the component is unmounted.
    return () => {
      workerInstance?.removeEventListener("message", onMessageReceived);
      workerInstance?.removeEventListener("error", onErrorReceived);
    };
  }, [workerInstance]);

  // Send the messages to the worker thread whenever the `messages` state changes.
  useEffect(() => {
    if (messages.filter((x) => x.role === "user").length === 0) {
      // No user messages yet: do nothing.
      return;
    }
    if (messages.at(-1).role === "assistant") {
      // Do not update if the last message is from the assistant
      return;
    }
    setTps(null);
    console.log("Sending messages to worker", messages);
    workerInstance?.postMessage({ type: "generate", data: messages });
  }, [messages, isRunning]);

  return (
    <Stack
      align={"stretch"}
      flex={1}
      p={0}
      h={"100%"}
      style={{
        overflowY: "hidden",
      }}
    >
      <Card withBorder>
        <Stack flex={1} h={"100%"}>
          <Group justify={"space-between"} align={"center"}>
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
            <Group justify={"flex-end"}>
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
                disabled={status === null || status === "loading"}
              >
                {status === null ? "Running feature checks..." : "Load model"}
              </Button>
            </Group>
          )}
        </Stack>
      </Card>
      {status === "ready" && (
        <Stack style={{ overflow: "hidden" }} gap={"sm"} flex={1}>
          <ScrollArea flex={1} h={"100%"}>
            <Stack>
              {messages.map((message, i) => (
                <Card withBorder key={i} radius={"lg"}>
                  <Stack
                    gap={"md"}
                    align={message.role === "user" ? "flex-end" : "flex-start"}
                  >
                    <Badge>{message.role}</Badge>
                    <Text>{message.content}</Text>
                    {message.image && (
                      <img
                        src={message.image}
                        alt={"Generated image"}
                        className={`min-w-20 min-h-20 relative p-2 ${message.role === "user" ? "w-20 h-20" : undefined}`}
                      />
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
          <Stack>
            {image && (
              <Paper p={"md"} radius={"lg"} withBorder>
                <Indicator>
                  <img
                    src={image}
                    alt={"Generated image"}
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
                size={"lg"}
                placeholder="Enter your message..."
                value={input}
                flex={1}
                style={{
                  zIndex: 1,
                }}
                leftSection={
                  <FileButton
                    onChange={(file) => {
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setImage(e.target?.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                  >
                    {(props) => (
                      <ActionIcon {...props} mx={"md"}>
                        <TbUpload />
                      </ActionIcon>
                    )}
                  </FileButton>
                }
                onKeyDown={(e) => {
                  if (
                    input.length > 0 &&
                    !isRunning &&
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault(); // Prevent default behavior of Enter key
                    onEnter(input, image);
                  }
                }}
                onChange={(e) => setInput(e.currentTarget.value)}
                disabled={status !== "ready"}
              />
            </Group>
          </Stack>
        </Stack>
      )}
      {status === "loading" && (
        <Box h={"100vh"} flex={1}>
          <div className="w-full max-w-[500px] text-left mx-auto p-4 bottom-0 mt-auto">
            <p className="text-center mb-1">{loadingMessage}</p>
            {progressItems.map(({ file, progress, total }, i) => (
              <Stack>
                <Text c={"dimmed"}>{file}</Text>
                <Progress key={i} value={progress} />
              </Stack>
            ))}
          </div>
        </Box>
      )}
    </Stack>
  );
}
