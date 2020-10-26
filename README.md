# Chariot

A Raspberry Pi driven experiment in autonomous driving

## Inputs

- Camera
  1. At every node of the path, capture image
  1. Warp image?
  1. Calculate pixels’ brightnesses
  1. Calculate whether brightnesses meet a certain threshold
  1. Detect edges
  1. Discard outliers
  1. Calculate midpoint of edges
  1. Simplify line with Ramer-Douglas-Peucker algorithm
  1. Output path
  1. Calculate pixels’ RGB colour
  1. Calculate whether colours meet a certain redness threshold
  1. Detect edges
  1. Discard outliers
  1. Collect pixels encircled by edges
  1. Pass collected images to MNIST and SketchRNN
  1. Calculate most likely number/sketch
  1. Output sign
  1. If the sign is a traffic light, calculate the position of the traffic light
  1. Calculate the colour of the traffic light
  1. Output traffic light

## Outputs

- Chassis
- Motors
  1. At every node of the path, calculate in which direction the chassis needs to turn
  1. Revolve the opposite front wheel until the chassis is inline with the next edge
  1. Drive to the next node
  1. At every sign, follow the instructions of the sign
  1. At every traffic light, follow the instructions of the colour
- Wheel housing
- Electronics housing

## Peripherals

- Signs
- Traffic lights
