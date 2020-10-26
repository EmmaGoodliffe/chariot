import { join } from "path";
import { SignDetector } from "./detectors";
import Image from "./detectors/Image";
import MNIST from "./recognisers/MNIST";

const POST_SIGN_PATH = join(__dirname, "post-sign.png");

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
  const signImage = sign.sign;
  const signWidth = Math.sqrt(signImage.length);
  const signPng = await MNIST.imageToPng(signImage, signWidth, signWidth);
  const requiredSignImageWidth = MNIST.getRequiredImageWidth();
  const resizedSignPng = await MNIST.resizePng(signPng, requiredSignImageWidth);
  await resizedSignPng.writeAsync(POST_SIGN_PATH);
  const resizedSignImage = new Image(POST_SIGN_PATH);
  const resizedSignPixels = await resizedSignImage.getPixels();
  const resizedSignGreyScalePixels = resizedSignPixels.rgba.map(rgba => {
    const [r, g, b, a] = rgba;
    if (!(r === g && r === b)) {
      throw "RGB values were not all equal";
    }
    if (a !== 255) {
      throw "Alpha values were not all 255";
    }
    return r;
  });
  const image = resizedSignGreyScalePixels;
  const nn = await mnist.nn.load(
    join(__dirname, "recognisers/MNIST/complete-model")
  );
  const predicted = await nn.predictOnce(image);
  const number = predicted.label;
  console.log(number, predicted.confidence);
};

run().catch(console.error);
