import { join } from "path";
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
  console.time("read");
  quickDraw.readData("train");
  console.timeEnd("read");
  console.time("train");
  await quickDraw.train();
  console.timeEnd("train");
  console.time("save");
  await quickDraw.nn.save(join(__dirname, "recognisers/QuickDraw/model"));
  console.timeEnd("save");
  console.time("test");
  console.log(await quickDraw.test());
  console.timeEnd("test");
};

run().catch(console.error);

// TODO: document data sources
