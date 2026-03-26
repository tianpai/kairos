import { Output, generateText, streamText } from "ai";
import type { LanguageModel } from "ai";
import type {
  AIProvider,
  GenerateParams,
  StreamParams,
} from "./provider.interface";

type ModelFactory = (modelId: string) => LanguageModel;

export class BaseProvider implements AIProvider {
  private readonly createModel: ModelFactory;

  constructor(createModel: ModelFactory) {
    this.createModel = createModel;
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { output } = await generateText({
      model: this.createModel(params.model),
      output: Output.object({ schema: params.schema }),
      system: params.systemPrompt,
      prompt: params.userPrompt,
    });
    return output;
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialOutputStream, output } = streamText({
      model: this.createModel(params.model),
      output: Output.object({ schema: params.schema }),
      system: params.systemPrompt,
      prompt: params.userPrompt,
    });

    if (params.onPartial) {
      for await (const partial of partialOutputStream) {
        params.onPartial(partial);
      }
    }

    return await output;
  }
}
