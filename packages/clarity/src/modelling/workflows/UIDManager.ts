class TempUIDManager {
  private static currentId: number = 0;

  static getNextUID(): number {
    this.currentId += 1;
    return this.currentId;
  }

  static reset(): void {
    this.currentId = 0;
  }

  // static getCurrentUid(): string {
  //   return this.currentId.toString();
  // }
}

export default TempUIDManager;
