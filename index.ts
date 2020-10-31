import { join } from "path";
import { PathDetector, SignDetector } from "./detectors";
import { MNIST, QuickDraw } from "./recognisers";

const run = async () => {
  const pathDetector = new PathDetector(join(__dirname, "assets/path.png"));
  const path = await pathDetector.detect(5);
  console.log(path.path.length);

  const mnistSignDetector = new SignDetector(
    join(__dirname, "assets/mnist-sign.png")
  );
  const mnistSign = await mnistSignDetector.detect();
  const mnistImage = await MNIST.prepareImage(mnistSign.sign);
  const mnist = new MNIST();
  const mnistNn = await mnist.nn.load(
    join(__dirname, "recognisers/MNIST/complete-model")
  );
  const mnistPredicted = await mnistNn.predictOnce(mnistImage);
  const number = mnistPredicted.label;
  console.log(number, mnistPredicted.confidence);

  const quickDrawSignDetector = new SignDetector(
    join(__dirname, "assets/qd-sign.png")
  );
  const quickDrawSign = await quickDrawSignDetector.detect();
  const quickDrawImage = await QuickDraw.prepareImage(quickDrawSign.sign);
  const quickDraw = new QuickDraw();
  const quickDrawNn = await quickDraw.nn.load(
    "recognisers/QuickDraw/complete-model"
  );
  const quickDrawPredicted = await quickDrawNn.predictOnce(quickDrawImage);
  const sketch = quickDrawPredicted.label;
  console.log(sketch, quickDrawPredicted.confidence);
};

run().catch(console.error);

// TODO: document data sources
// TODO: handle type for neural network labels
