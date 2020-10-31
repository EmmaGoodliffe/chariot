import { join } from "path";
import { PathDetector, SignDetector } from "../detectors";
import { MNIST, QuickDraw } from "../recognisers";

test("path", async () => {
  const detector = new PathDetector(join(__dirname, "../assets/path.png"));
  const detected = await detector.detect(5);
  expect(detected.path.length).toBeLessThan(20);
});

test("MNIST", async () => {
  const detector = new SignDetector(
    join(__dirname, "../assets/mnist-sign.png")
  );
  const detected = await detector.detect();
  const image = await MNIST.prepareImage(detected.sign);
  const mnist = new MNIST();
  const nn = await mnist.nn.load(
    join(__dirname, "../recognisers/MNIST/test-model")
  );
  const predicted = await nn.predictOnce(image);
  const number = predicted.label;
  expect(number).toBe("2");
  expect(predicted.confidence).toBeGreaterThan(0.5);
});

test("QuickDraw", async () => {
  const detector = new SignDetector(join(__dirname, "../assets/qd-sign.png"));
  const detected = await detector.detect();
  const image = await QuickDraw.prepareImage(detected.sign);
  const quickDraw = new QuickDraw();
  const nn = await quickDraw.nn.load(
    join(__dirname, "../recognisers/QuickDraw/test-model")
  );
  const predicted = await nn.predictOnce(image);
  const sketch = predicted.label;
  expect(sketch).toBe("traffic light");
  expect(predicted.confidence).toBeGreaterThan(0.5);
});
