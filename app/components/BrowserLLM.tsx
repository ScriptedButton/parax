// BrowserLLM.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Card,
  Progress,
  Title,
  Text,
  Select,
  Textarea,
  Button,
  Stack,
  Container,
  Group,
} from "@mantine/core";

interface ProgressItem {
  file: string;
  progress: number;
  status?: string;
}

interface WorkerResponse {
  status: "initiate" | "progress" | "done" | "ready" | "update" | "complete";
  file?: string;
  progress?: number;
  output?: string;
}

const ParaphraseTool: React.FC = () => {
  const [ready, setReady] = useState<boolean | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const worker = useRef<Worker | null>(null);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [style, setStyle] = useState<"standard" | "formal" | "simple">(
    "standard",
  );

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("../worker.js", import.meta.url), {
        type: "module",
      });
    }

    const onMessageReceived = (e: MessageEvent<WorkerResponse>) => {
      switch (e.data.status) {
        case "initiate":
          setReady(false);
          setProgressItems((prev) => [...prev, e.data as ProgressItem]);
          console.log(e.data);

          break;

        case "progress":
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress! };
              }
              return item;
            }),
          );
          break;

        case "done":
          if (e.data.file) {
            setProgressItems((prev) =>
              prev.filter((item) => item.file !== e.data.file),
            );
          }
          break;

        case "ready":
          setReady(true);
          break;

        case "update":
          if (typeof e.data.output === "string") {
            setOutput((o) => o + e.data.output!);
          }
          break;

        case "complete":
          setDisabled(false);
          break;
      }
    };

    worker.current.addEventListener("message", onMessageReceived);

    return () => {
      if (worker.current) {
        worker.current.removeEventListener("message", onMessageReceived);
      }
    };
  }, []);

  const paraphrase = () => {
    if (!worker.current) return;

    setOutput("");
    setDisabled(true);
    worker.current.postMessage({
      text: input,
      style,
    });
  };

  return (
    <Container
      size="xl"
      p={"lg"}
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        <Title order={1}>Paraphrasing Tool</Title>
        <Text c="dimmed">
          Enter your text below to paraphrase it in different styles.
        </Text>

        <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
          <Select
            value={style}
            onChange={(value) => setStyle(value as typeof style)}
            data={[
              { value: "standard", label: "Standard Paraphrase" },
              { value: "formal", label: "Formal Style" },
              { value: "simple", label: "Simplified Language" },
            ]}
            disabled={disabled}
          />

          <Group grow align={"stretch"}>
            <Stack flex={1}>
              <Title order={4}>Input</Title>
              <Textarea
                value={input}
                autosize
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Enter text to paraphrase..."
                minRows={10}
                disabled={disabled}
              />
            </Stack>
            {output && (
              <Stack
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <Title order={4}>Paraphrased</Title>
                <Textarea
                  value={output}
                  autosize
                  placeholder="Paraphrased text will appear here..."
                  minRows={10}
                />
              </Stack>
            )}
          </Group>

          {progressItems.map((data) => (
            <div key={data.file}>
              <Progress value={data.progress} />
              <Text>{data.file}</Text>
            </div>
          ))}

          <Button onClick={paraphrase} disabled={disabled} loading={disabled}>
            {disabled ? "Paraphrasing..." : "Paraphrase Text"}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default ParaphraseTool;
