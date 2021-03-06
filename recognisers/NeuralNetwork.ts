import * as tf from "@tensorflow/tfjs";
import { join } from "path";
import { chunk } from "../helpers";
import { nodeFileSystemRouter } from "./io";

const MODEL_DIR = "model";

interface TensorsInMemory {
  hiddenLayer: number;
  outputLayer: number;
  model: number;
}

interface TotalledTensorsInMemory extends TensorsInMemory {
  observedTotal: number;
  realTotal: number;
}

interface Prediction<L> {
  label: L;
  confidence: number;
}

const disposeAll = (tensors: tf.Tensor[]) => {
  for (const tensor of tensors) {
    tensor.dispose();
  }
};

const pathToFileUrl = (path: string) => `file://${path}`;

const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

const createModel = <L>(
  inputUnits: number,
  labels: L[],
  hiddenUnits: number,
  learningRate: number
) => {
  const model = tf.sequential();
  const hiddenLayer = tf.layers.dense({
    units: hiddenUnits,
    activation: "sigmoid",
    inputShape: [inputUnits],
  });
  model.add(hiddenLayer);
  const hiddenLayerTensors = tf.memory().numTensors;
  const outputUnits = labels.length;
  const outputLayer = tf.layers.dense({
    units: outputUnits,
    activation: "softmax",
  });
  model.add(outputLayer);
  const outputLayerTensors = tf.memory().numTensors - hiddenLayerTensors;
  model.compile({
    loss: tf.losses.meanSquaredError,
    optimizer: tf.train.sgd(learningRate),
  });
  const modelTensors =
    tf.memory().numTensors - (hiddenLayerTensors + outputLayerTensors);
  const tensorsInMemory = {
    hiddenLayer: hiddenLayerTensors,
    outputLayer: outputLayerTensors,
    model: modelTensors,
  };
  return {
    model,
    tensorsInMemory,
  };
};

export default class NeuralNetwork<L extends string> {
  model: tf.Sequential;
  private tensorsInMemory: TensorsInMemory;
  private modelDir: string;
  constructor(model: tf.Sequential, labels: L[]);
  constructor(
    model: null,
    labels: L[],
    inputUnits: number,
    hiddenUnits: number,
    learningRate?: number
  );
  constructor(
    model: tf.Sequential | null,
    public labels: L[],
    inputUnits?: number,
    hiddenUnits?: number,
    learningRate = 0.1
  ) {
    if (model) {
      this.model = model;
      this.tensorsInMemory = {
        hiddenLayer: 0,
        outputLayer: 0,
        model: 0,
      };
    } else {
      if (!inputUnits) {
        throw "No input units";
      }
      if (!hiddenUnits) {
        throw "No hidden units";
      }
      const { model, tensorsInMemory } = createModel(
        inputUnits,
        labels,
        hiddenUnits,
        learningRate
      );
      this.model = model;
      this.tensorsInMemory = tensorsInMemory;
    }
    this.modelDir = join(__dirname, MODEL_DIR);
  }
  private getTensorsInMemory(): TotalledTensorsInMemory {
    const total = Object.values(this.tensorsInMemory).reduce((a, b) => a + b);
    return {
      ...this.tensorsInMemory,
      observedTotal: total,
      realTotal: tf.memory().numTensors,
    };
  }
  async train(
    inputs: number[][],
    labels: L[],
    epochs = 1,
    repeats = 1
  ): Promise<number> {
    const tensorInputs = tf.tensor(inputs);
    const outputs = labels.map(label => {
      const index = this.labels.indexOf(label);
      const output = Array<number>(this.labels.length).fill(0);
      output[index] = 1;
      return output;
    });
    const tensorOutputs = tf.tensor(outputs);
    let loss = -1;
    for (let i = 0; i < repeats; i++) {
      const response = await this.model.fit(tensorInputs, tensorOutputs, {
        epochs,
        shuffle: true,
      });
      const receivedLoss = response.history.loss[0];
      if (receivedLoss instanceof tf.Tensor) {
        throw `Loss was a tensor, ${receivedLoss.toString()}`;
      }
      loss = receivedLoss;
    }
    disposeAll([tensorInputs, tensorOutputs]);
    return loss;
  }
  async trainVerbose(
    inputs: number[][],
    labels: L[],
    epochs?: number,
    repeats?: number
  ): Promise<number> {
    const chunkSize = 1000;
    const points = inputs.map((input, i) => {
      const label = labels[i];
      const point = { input, label };
      return point;
    });
    const shuffledPoints = shuffle(points);
    const shuffledInputs = shuffledPoints.map(point => point.input);
    const shuffledLabels = shuffledPoints.map(point => point.label);
    const inputChunks = chunk(shuffledInputs, chunkSize);
    const labelChunks = chunk(shuffledLabels, chunkSize);
    let loss = -1;
    for (let i = 0; i < inputChunks.length; i++) {
      const imageChunk = inputChunks[i];
      const labelChunk = labelChunks[i];
      const start = Date.now();
      loss = await this.train(imageChunk, labelChunk, epochs, repeats);
      const end = Date.now();
      console.log({
        loss,
        progress: `${(((i + 1) / inputChunks.length) * 100).toFixed(2)}%`,
        time: `${(end - start) / 1000}s`,
        memory: this.getTensorsInMemory(),
      });
    }
    return loss;
  }
  async test(inputs: number[][], labels: L[]): Promise<number> {
    const predictions = await this.predict(inputs);
    const predictedLabels = predictions.map(prediction => prediction.label);
    let totalCorrect = 0;
    for (const i in predictedLabels) {
      const predictedLabel = predictedLabels[i];
      const correctLabel = labels[i];
      if (predictedLabel === correctLabel) {
        totalCorrect++;
      }
    }
    return totalCorrect / labels.length;
  }
  async predict(inputs: number[][]): Promise<Prediction<L>[]> {
    const tensorInputs = tf.tensor(inputs);
    const tensorPredicted = this.model.predict(tensorInputs);
    if (tensorPredicted instanceof Array) {
      throw "Predicted outputs were an array";
    }
    const predicted = (await tensorPredicted.array()) as number[][];
    const predictedLabels = predicted.map(probabilities => {
      const max = Math.max(...probabilities);
      const index = probabilities.indexOf(max);
      const label = this.labels[index];
      return {
        label,
        confidence: max,
      };
    });
    disposeAll([tensorInputs, tensorPredicted]);
    return predictedLabels;
  }
  async predictOnce(input: number[]): Promise<Prediction<L>> {
    const inputs = [input];
    const labels = await this.predict(inputs);
    if (labels.length !== 1) {
      throw "Predicted multiple labels for 1 input";
    }
    const [label] = labels;
    return label;
  }
  async save(path?: string): Promise<void> {
    const url = pathToFileUrl(path || this.modelDir);
    const handler = nodeFileSystemRouter(url);
    if (!handler) {
      throw "Save handler was null";
    }
    await this.model.save(handler);
  }
  async load(path?: string): Promise<NeuralNetwork<L>> {
    const filePath = join(path || this.modelDir, "model.json");
    const url = pathToFileUrl(filePath);
    const handler = nodeFileSystemRouter(url);
    if (!handler) {
      throw "Load handler was null";
    }
    const model = await tf.loadLayersModel(handler);
    if (model instanceof tf.Sequential) {
      return new NeuralNetwork(model, this.labels);
    } else {
      throw "Model was not sequential";
    }
  }
}
