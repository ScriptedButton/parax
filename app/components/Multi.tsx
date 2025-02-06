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
} from "@mantine/core";
import { useEffect, useState } from "react";
import { TbUpload } from "react-icons/tb";

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
    <Stack gap={"md"} p={"md"} align={"stretch"} h={"100%"}>
      <Card withBorder>
        <Stack flex={1}>
          <Group justify={"space-between"}>
            <Title order={4}>Multi-Modal LLM</Title>
          </Group>
          {(status === null || status === "idle") && messages.length === 0 && (
            <Button
              onClick={() => {
                workerInstance?.postMessage({ type: "load" });
                setStatus("loading");
              }}
              disabled={status === null || status === "loading"}
            >
              {status === null ? "Running feature checks..." : "Load model"}
            </Button>
          )}
        </Stack>
        {status === "loading" && (
          <>
            <div className="w-full max-w-[500px] text-left mx-auto p-4 bottom-0 mt-auto">
              <p className="text-center mb-1">{loadingMessage}</p>
              {progressItems.map(({ file, progress, total }, i) => (
                <Stack>
                  <Text c={"dimmed"}>{file}</Text>
                  <Progress key={i} value={progress} />
                </Stack>
              ))}
            </div>
          </>
        )}
      </Card>
      {status === "ready" && (
        <>
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
                    className="w-20 h-20 min-w-20 min-h-20 relative p-2"
                  />
                )}
              </Stack>
            </Card>
          ))}
          <p className="text-center text-sm min-h-6 text-gray-500 dark:text-gray-300">
            {messages.length > 0 && (
              <>
                {tps ? (
                  <>
                    {!isRunning && (
                      <span>
                        Generated {numTokens} tokens in{" "}
                        {(numTokens / tps).toFixed(2)} seconds&nbsp;&#40;
                      </span>
                    )}
                    <span>{tps.toFixed(2)}</span>
                    <span className="text-gray-500 dark:text-gray-300">
                      tokens/second
                    </span>
                    {!isRunning && <span className="mr-1">&#41;.</span>}
                  </>
                ) : (
                  imageProgress && (
                    <>
                      {isRunning ? (
                        <>
                          <span>Generating image...</span>&nbsp;&#40;
                          <span className="font-medium font-mono text-center text-black dark:text-white">
                            {(imageProgress * 100).toFixed(2)}%
                          </span>
                          <span className="mr-1">&#41;</span>
                        </>
                      ) : (
                        <span>
                          Generated image in{" "}
                          {(imageGenerationTime / 1000).toFixed(2)}{" "}
                          seconds.&nbsp;
                        </span>
                      )}
                    </>
                  )
                )}

                {!isRunning && (
                  <Button
                    className="underline cursor-pointer"
                    onClick={() => setMessages([])}
                  >
                    Reset
                  </Button>
                )}
              </>
            )}
          </p>
          <Flex flex={1} />
          <Group grow>
            <TextInput
              placeholder="Enter your message..."
              value={input}
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
                    <ActionIcon {...props}>
                      <TbUpload />
                    </ActionIcon>
                  )}
                </FileButton>
              }
              rightSection={
                image && (
                  <img
                    src={image}
                    alt={"Selected image"}
                    className="w-20 h-20 min-w-20 min-h-20 relative p-2"
                  />
                )
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
        </>
      )}
    </Stack>
  );
}
