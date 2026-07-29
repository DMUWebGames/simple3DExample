export class SignatureManager {
    constructor(maxEntities = 10000) {
        this.signatures = new Uint32Array(maxEntities);
    }

    setBit(entityId, componentBit) {
        this.signatures[entityId] |= componentBit;
    }

    clearBit(entityId, componentBit) {
        this.signatures[entityId] &= ~componentBit; // FIXED: was incorrectly using |
    }

    matches(entityId, systemRequiredMask) {
        return (this.signatures[entityId] & systemRequiredMask) === systemRequiredMask;
    }

    getSignature(entityId) {
        return this.signatures[entityId];
    }

    clearSignature(entityId) {
        this.signatures[entityId] = 0;
    }
}