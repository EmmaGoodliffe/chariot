// import { join } from "path";
// import { PathDetector, SignDetector } from "./detectors";
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
  await mnist.train();
  await mnist.nn.save();
  await mnist.nn.load();
};

run().catch(console.error);
