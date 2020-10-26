import * as tf from "@tensorflow/tfjs";

interface TensorsInMemory {
  hiddenLayer: number;
  outputLayer: number;
  model: number;
}

interface TotalledTensorsInMemory extends TensorsInMemory {
  observedTotal: number;
  realTotal: number;
}

interface Prediction {
  label: string;
  confidence: number;
}

const disposeAll = (tensors: tf.Tensor[]) => {
  for (const tensor of tensors) {
    tensor.dispose();
  }
};

export default class NeuralNetwork {
  model: tf.Sequential;
  private tensorsInMemory: TensorsInMemory;
  constructor(
    inputUnits: number,
    public labels: string[],
    hiddenUnits = 16,
    learningRate = 0.1
  ) {
    const model = tf.sequential();
    const activation = "softmax";
    const hiddenLayer = tf.layers.dense({
      units: hiddenUnits,
      activation,
      inputShape: [inputUnits],
    });
    model.add(hiddenLayer);
    const hiddenLayerTensors = tf.memory().numTensors;
    const outputUnits = labels.length;
    const outputLayer = tf.layers.dense({
      units: outputUnits,
      activation,
    });
    model.add(outputLayer);
    const outputLayerTensors = tf.memory().numTensors - hiddenLayerTensors;
    model.compile({
      loss: tf.losses.meanSquaredError,
      optimizer: tf.train.sgd(learningRate),
    });
    const modelTensors =
      tf.memory().numTensors - (hiddenLayerTensors + outputLayerTensors);
    this.model = model;
    this.tensorsInMemory = {
      hiddenLayer: hiddenLayerTensors,
      outputLayer: outputLayerTensors,
      model: modelTensors,
    };
  }
  getTensorsInMemory(): TotalledTensorsInMemory {
    const total = Object.values(this.tensorsInMemory).reduce((a, b) => a + b);
    return {
      ...this.tensorsInMemory,
      observedTotal: total,
      realTotal: tf.memory().numTensors,
    };
  }
  async train(
    inputs: number[][],
    labels: string[],
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
    let finalLoss = -1;
    for (let i = 0; i < repeats; i++) {
      const response = await this.model.fit(tensorInputs, tensorOutputs, {
        epochs,
        shuffle: true,
      });
      const loss = response.history.loss[0];
      console.log(`${i}`.padStart(`${repeats}`.length, "0"), loss);
      if (!(typeof loss === "number")) {
        throw `Loss was a tensor, ${loss.toString()}`;
      }
      finalLoss = loss;
    }
    disposeAll([tensorInputs, tensorOutputs]);
    return finalLoss;
  }
  async test(inputs: number[][], labels: string[]): Promise<number> {
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
  async predict(inputs: number[][]): Promise<Prediction[]> {
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
  async predictOnce(input: number[]): Promise<Prediction> {
    const inputs = [input];
    const labels = await this.predict(inputs);
    if (labels.length !== 1) {
      throw "Predicted multiple labels for 1 input";
    }
    const [label] = labels;
    return label;
  }
}
