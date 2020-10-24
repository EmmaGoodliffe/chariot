import { join } from "path";
import PathDetector from "./detectors/PathDetector";
import SignDetector from "./detectors/SignDetector";
import mnist from "./recognisers/MNIST";

const detect = async () => {
  const pathDetector = new PathDetector(join(__dirname, "path.png"));
  const path = await pathDetector.detect(5);
  const signDetector = new SignDetector(join(__dirname, "sign.png"));
  const sign = await signDetector.detect();
  console.log({ path, sign });
};

// detect().catch(console.error);
console.log(detect);

mnist().catch(console.error);
