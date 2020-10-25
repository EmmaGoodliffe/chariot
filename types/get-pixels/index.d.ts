declare module "get-pixels" {
  interface View3dUint8Array {
    data: Uint8Array;
    shape: [number, number, number];
    stride: [number, number, number];
    offset: number;
  }

  declare function getPixels(
    url: string,
    cb: (err: Error | null, pixels: View3dUint8Array) => void
  ): void;

  export = getPixels;
}
