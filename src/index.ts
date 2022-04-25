import { Params } from "upload-image-ai-plugin/types/Params";
import { transform } from "upload-plugin-sdk";
import { promises as fsAsync } from "fs";
import { RekognitionClient, DetectLabelsCommand, DetectLabelsCommandOutput } from "@aws-sdk/client-rekognition";

export default transform<Params>({
  run: async ({ resolve, setMetadata, params }) => {
    const client = new RekognitionClient({ region: "...TODO..." });
    const command = new DetectLabelsCommand({
      Image: {
        S3Object: {
          Bucket: "...TODO...",
          Name: "...TODO..."
        }
      },
      MaxLabels: params.maxKeywords,
      MinConfidence: params.minConfidence
    });

    let data: DetectLabelsCommandOutput;
    try {
      data = await client.send(command);
    } catch (e) {
      throw new Error(`Unable infer labels from image: ${(e as Error).message}`);
    }

    const originalFilePath = resolve("/");
    const keywords = (data.Labels ?? []).flatMap(x =>
      x.Name === undefined || x.Confidence === undefined ? [] : [{ name: x.Name, confidence: x.Confidence }]
    );
    const keywordsJson = JSON.stringify({ keywords });
    await fsAsync.writeFile(originalFilePath, keywordsJson);
    await setMetadata("/", {
      contentType: "application/json"
    });
  }
});
