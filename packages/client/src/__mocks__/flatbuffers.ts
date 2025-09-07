export class MockBuilder {
  private data: number[] = [];
  private offset = 0;

  constructor(initialSize: number = 1024) {
    // Initialize with zeros
    this.data = new Array(initialSize).fill(0);
  }

  startTable(_numFields: number): number {
    return this.offset;
  }

  endTable(): number {
    return this.offset;
  }

  startObject(_numFields: number): number {
    return this.offset;
  }

  endObject(): number {
    return this.offset;
  }

  addFieldOffset(_field: number, _offset: number, _defaultOffset: number): void {
    // Mock implementation
  }

  addFieldInt8(_field: number, _value: number, _defaultValue: number): void {
    // Mock implementation
  }

  addFieldInt64(_field: number, _value: bigint, _defaultValue: bigint): void {
    // Mock implementation
  }

  createString(_str: string): number {
    return this.offset++;
  }

  createByteVector(_data: Uint8Array): number {
    return this.offset++;
  }

  finish(_rootTable: number): void {
    // Mock implementation
  }

  asUint8Array(): Uint8Array {
    return new Uint8Array(this.data);
  }
}

export class MockByteBuffer {
  constructor(public data: Uint8Array) {}
}

export const flatbuffers = {
  Builder: MockBuilder,
  ByteBuffer: MockByteBuffer
};

export default flatbuffers;
