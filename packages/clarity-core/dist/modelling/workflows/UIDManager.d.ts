declare class TempUIDManager {
    private static currentId;
    static getNextUID(): number;
    static reset(): void;
}
export default TempUIDManager;
