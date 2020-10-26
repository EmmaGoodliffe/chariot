import { join } from "path";
import { SignDetector } from "./detectors";
import MNIST from "./recognisers/MNIST";

// const detect = async () => {
//   const pathDetector = new PathDetector(join(__dirname, "path.png"));
//   const path = await pathDetector.detect(5);
//   const signDetector = new SignDetector(join(__dirname, "sign.png"));
//   const sign = await signDetector.detect();
//   console.log({ path, sign });
// };

// detect().catch(console.error);

const mnist = new MNIST();

const run = async () => {
  const signDetector = new SignDetector(join(__dirname, "sign.png"));
  const sign = await signDetector.detect();
  const image = await MNIST.prepareImage(sign.sign);
  const nn = await mnist.nn.load(
    join(__dirname, "recognisers/MNIST/complete-model")
  );
  const predicted = await nn.predictOnce(image);
  const number = predicted.label;
  console.log(number, predicted.confidence);
};

run().catch(console.error);
