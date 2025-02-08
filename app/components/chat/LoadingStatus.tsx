import { Box, Progress, Stack, Text } from "@mantine/core";
import type { ProgressItem } from "~/components/chat/types";

interface LoaderStatusProps {
  loadingMessage: string;
  progressItems: ProgressItem[];
}

export const LoaderStatus = (props: LoaderStatusProps) => {
  const { loadingMessage, progressItems } = props;

  return (
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
  );
};
