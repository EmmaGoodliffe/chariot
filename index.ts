import { QuickDraw } from "./recognisers";

const run = async () => {
  // const pathDetector = new PathDetector(join(__dirname, "assets/path.png"));
  // const path = await pathDetector.detect(5);
  // console.log(path.path.length);
  // const signDetector = new SignDetector(join(__dirname, "assets/sign.png"));
  // const sign = await signDetector.detect();
  // const image = await MNIST.prepareImage(sign.sign);
  // const mnist = new MNIST();
  // const nn = await mnist.nn.load(
  //   join(__dirname, "recognisers/MNIST/complete-model")
  // );
  // const predicted = await nn.predictOnce(image);
  // const number = predicted.label;
  // console.log(number, predicted.confidence);
  const quickDraw = new QuickDraw();
};

run().catch(console.error);
