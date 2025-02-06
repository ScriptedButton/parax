// worker.ts
import {
  pipeline,
  TextGenerationPipeline,
  TextStreamer,
} from "@huggingface/transformers";

class ParaphrasePipeline {
  static task = "text-generation";
  static model = "HuggingFaceTB/SmolLM2-1.7B-Instruct";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        dtype: "q4f16",
        device: "webgpu",
      });
    }
    return this.instance;
  }
}

const stylePrompts = {
  standard: "Paraphrase this text while maintaining the same meaning:",
  formal: "Paraphrase this text in a more formal and professional tone:",
  simple: "Paraphrase this text in simpler, easier to understand language:",
};

self.addEventListener("message", async (event) => {
  const paraphraser = await ParaphrasePipeline.getInstance((progress) => {
    self.postMessage(progress);
  });

  const streamer = new TextStreamer(paraphraser.tokenizer, {
    skip_prompt: true,
    callback_function: (output) => {
      self.postMessage({
        status: "update",
        output: output,
      });
    },
  });

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant specialized in paraphrasing text while preserving its original meaning.",
    },
    {
      role: "user",
      content: `${stylePrompts[event.data.style] || stylePrompts.standard}\n\n${event.data.text}`,
    },
  ];

  const output = await paraphraser(messages, {
    max_new_tokens: 256,
    streamer,
    temperature: 0.2,
    top_p: 0.9,
    do_sample: true,
  });

  self.postMessage({
    status: "complete",
    output: output,
  });
});
