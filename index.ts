// import { join } from "path";
// import { PathDetector, SignDetector } from "./detectors";
import MNIST from "./recognisers/MNIST";

new MNIST();

// const detect = async () => {
//   const pathDetector = new PathDetector(join(__dirname, "path.png"));
//   const path = await pathDetector.detect(5);
//   const signDetector = new SignDetector(join(__dirname, "sign.png"));
//   const sign = await signDetector.detect();
//   console.log({ path, sign });
// };

// detect().catch(console.error);
